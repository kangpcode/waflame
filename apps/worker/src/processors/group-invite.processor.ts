import fs from 'node:fs';
import path from 'node:path';
import { Job, Worker } from 'bullmq';
import { parse as parseCsv } from 'csv-parse/sync';
import { Redis } from 'ioredis';
import * as xlsx from 'xlsx';
import { prisma } from '@waflame/database';
import {
  GroupInviteJobData,
  ImportStatus,
  QueueName,
  normalizePhoneNumber,
  toWhatsAppJid,
} from '@waflame/shared';
import { sessionManager } from '@waflame/wa-core';
import { env } from '../config/env.js';

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const pubRedis = new Redis(env.REDIS_URL);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createGroupInviteWorker() {
  const worker = new Worker<GroupInviteJobData>(
    QueueName.GROUP_INVITE,
    async (job: Job<GroupInviteJobData>) => {
      const { tenantId, importId, deviceId, groupJid, filePath, phoneColumn, delaySec } = job.data;
      console.log(`[Worker:Group-Invite] Processing group invite ${importId} on device ${deviceId}`);

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

      // 1. Get Baileys provider
      const provider = sessionManager.getSession(deviceId);
      if (!provider) {
        await prisma.import.update({
          where: { id: importId },
          data: { status: ImportStatus.FAILED },
        });
        throw new Error(`Sesi perangkat ${deviceId} belum terhubung atau tidak aktif`);
      }

      // 2. Parse file
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
      const phoneIdx = headers.indexOf(phoneColumn);

      if (phoneIdx === -1) {
        await prisma.import.update({
          where: { id: importId },
          data: { status: ImportStatus.FAILED },
        });
        throw new Error(`Kolom ${phoneColumn} tidak ditemukan pada header`);
      }

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rawPhone = row[phoneIdx];

        if (!rawPhone) {
          failedCount++;
          continue;
        }

        try {
          const norm = normalizePhoneNumber(String(rawPhone));
          const jid = toWhatsAppJid(norm);

          await provider.inviteParticipants(groupJid, [jid]);
          successCount++;
        } catch (err: any) {
          console.warn(`[Worker:Group-Invite] Failed inviting ${rawPhone}: ${err.message}`);
          failedCount++;
        }

        const processed = i + 1;
        if (processed % 10 === 0 || processed === dataRows.length) {
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

        // Throttle to prevent anti-spam trigger
        if (i < dataRows.length - 1) {
          await sleep(delaySec * 1000);
        }
      }

      await prisma.import.update({
        where: { id: importId },
        data: {
          status: ImportStatus.COMPLETED,
          processedRows: dataRows.length,
          successRows: successCount,
          failedRows: failedCount,
        },
      });

      console.log(`[Worker:Group-Invite] Finished invite ${importId}. Success: ${successCount}, Failed: ${failedCount}`);
    },
    {
      connection: redis,
      concurrency: 1, // strictly 1 concurrent job to protect WhatsApp session
    }
  );

  return worker;
}
