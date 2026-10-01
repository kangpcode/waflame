import fs from 'node:fs';
import path from 'node:path';
import { Job, Worker } from 'bullmq';
import { parse as parseCsv } from 'csv-parse/sync';
import { Redis } from 'ioredis';
import * as xlsx from 'xlsx';
import { prisma } from '@waflame/database';
import {
  CsvImportJobData,
  ImportStatus,
  QueueName,
  normalizePhoneNumber,
} from '@waflame/shared';
import { env } from '../config/env.js';

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const pubRedis = new Redis(env.REDIS_URL);

export function createCsvImportWorker() {
  const worker = new Worker<CsvImportJobData>(
    QueueName.CSV_IMPORT,
    async (job: Job<CsvImportJobData>) => {
      const { tenantId, importId, filePath, mappingConfig } = job.data;
      console.log(`[Worker:CSV-Import] Processing import ${importId} for tenant ${tenantId}`);

      if (!fs.existsSync(filePath)) {
        await prisma.import.update({
          where: { id: importId },
          data: { status: ImportStatus.FAILED },
        });
        throw new Error(`File ${filePath} tidak ditemukan`);
      }

      await prisma.import.update({
        where: { id: importId },
        data: { status: ImportStatus.PROCESSING },
      });

      // 1. Parse rows
      const ext = path.extname(filePath).toLowerCase();
      let rawRows: any[][] = [];

      if (ext === '.csv' || ext === '.txt') {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        rawRows = parseCsv(fileContent, {
          skip_empty_lines: true,
          trim: true,
        }) as any[][];
      } else {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      }

      if (rawRows.length <= 1) {
        await prisma.import.update({
          where: { id: importId },
          data: { status: ImportStatus.COMPLETED, totalRows: 0, processedRows: 0 },
        });
        return;
      }

      const headers = rawRows[0].map((h: any) => String(h || '').trim());
      const dataRows = rawRows.slice(1);

      const phoneIdx = headers.indexOf(mappingConfig.phoneColumn);
      const firstNameIdx = headers.indexOf(mappingConfig.firstNameColumn);
      const lastNameIdx = mappingConfig.lastNameColumn
        ? headers.indexOf(mappingConfig.lastNameColumn)
        : -1;
      const emailIdx = mappingConfig.emailColumn
        ? headers.indexOf(mappingConfig.emailColumn)
        : -1;

      if (phoneIdx === -1 || firstNameIdx === -1) {
        await prisma.import.update({
          where: { id: importId },
          data: { status: ImportStatus.FAILED },
        });
        throw new Error('Kolom nomor telepon atau nama depan tidak ditemukan pada header file');
      }

      let successCount = 0;
      let failedCount = 0;
      const failedRowsLog: Array<{ rowNumber: number; reason: string; rowData: any }> = [];

      // Get tenant limit
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxContacts: true },
      });
      const maxContacts = tenant?.maxContacts || 1000;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = i + 2; // +1 for 0-index, +1 for header

        try {
          const rawPhone = row[phoneIdx];
          const rawFirstName = row[firstNameIdx];

          if (!rawPhone || !rawFirstName) {
            failedCount++;
            failedRowsLog.push({
              rowNumber,
              reason: 'Nomor telepon atau nama depan kosong',
              rowData: row,
            });
            continue;
          }

          const normalizedPhone = normalizePhoneNumber(String(rawPhone));
          const firstName = String(rawFirstName).trim();
          const lastName = lastNameIdx !== -1 && row[lastNameIdx] ? String(row[lastNameIdx]).trim() : null;
          const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : null;

          // Build custom fields
          const customFields: Record<string, any> = {};
          if (mappingConfig.customFieldColumns && mappingConfig.customFieldColumns.length > 0) {
            for (const colName of mappingConfig.customFieldColumns) {
              const colIdx = headers.indexOf(colName);
              if (colIdx !== -1 && row[colIdx] !== undefined) {
                customFields[colName] = row[colIdx];
              }
            }
          }

          // Check contact count quota
          const currentCount = await prisma.contact.count({
            where: { tenantId, deletedAt: null },
          });

          if (currentCount >= maxContacts) {
            failedCount++;
            failedRowsLog.push({
              rowNumber,
              reason: `Batas kuota kontak tercapai (${currentCount}/${maxContacts})`,
              rowData: row,
            });
            continue;
          }

          // Check if contact already exists
          const existing = await prisma.contact.findFirst({
            where: { tenantId, phoneNumber: normalizedPhone, deletedAt: null },
          });

          let contactId: string;

          if (existing) {
            if (mappingConfig.overwriteExisting) {
              const updated = await prisma.contact.update({
                where: { id: existing.id },
                data: {
                  firstName,
                  lastName: lastName || existing.lastName,
                  email: email || existing.email,
                  customFields: { ...((existing.customFields as any) || {}), ...customFields },
                },
              });
              contactId = updated.id;
              successCount++;
            } else {
              contactId = existing.id;
              // Skip updating existing contact without error
              successCount++;
            }
          } else {
            const created = await prisma.contact.create({
              data: {
                tenantId,
                firstName,
                lastName,
                phoneNumber: normalizedPhone,
                email,
                customFields,
              },
            });
            contactId = created.id;
            successCount++;
          }

          // Connect group relations
          if (mappingConfig.groupIds && mappingConfig.groupIds.length > 0) {
            for (const gid of mappingConfig.groupIds) {
              await prisma.contactGroupMember.upsert({
                where: { contactId_contactGroupId: { contactId, contactGroupId: gid } },
                update: {},
                create: { contactId, contactGroupId: gid },
              });
            }
          }

          // Connect tag relations
          if (mappingConfig.tagIds && mappingConfig.tagIds.length > 0) {
            for (const tid of mappingConfig.tagIds) {
              await prisma.contactTagRelation.upsert({
                where: { contactId_contactTagId: { contactId, contactTagId: tid } },
                update: {},
                create: { contactId, contactTagId: tid },
              });
            }
          }
        } catch (err: any) {
          failedCount++;
          failedRowsLog.push({
            rowNumber,
            reason: err.message,
            rowData: row,
          });
        }

        // Periodic progress report every 50 rows
        if ((i + 1) % 50 === 0 || i === dataRows.length - 1) {
          const processed = i + 1;
          await prisma.import.update({
            where: { id: importId },
            data: {
              processedRows: processed,
              successRows: successCount,
              failedRows: failedCount,
            },
          });

          await pubRedis.publish(
            `tenant:${tenantId}:imports`,
            JSON.stringify({
              importId,
              totalRows: dataRows.length,
              processedRows: processed,
              successRows: successCount,
              failedRows: failedCount,
            })
          );
        }
      }

      // Write error log if there are failures
      let errorLogPath: string | null = null;
      if (failedRowsLog.length > 0) {
        errorLogPath = filePath + '.errors.json';
        fs.writeFileSync(errorLogPath, JSON.stringify(failedRowsLog, null, 2));
      }

      await prisma.import.update({
        where: { id: importId },
        data: {
          processedRows: dataRows.length,
          successRows: successCount,
          failedRows: failedCount,
          status: ImportStatus.COMPLETED,
          errorLogUrl: errorLogPath,
        },
      });

      console.log(
        `[Worker:CSV-Import] Finished import ${importId}. Success: ${successCount}, Failed: ${failedCount}`
      );
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker:CSV-Import] Job ${job?.id} failed:`, err);
  });

  return worker;
}
