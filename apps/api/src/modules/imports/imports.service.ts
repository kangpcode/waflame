import fs from 'node:fs';
import path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import { prisma } from '@waflame/database';
import {
  GroupInviteCsvInput,
  ImportEntityType,
  ImportStatus,
  ProcessImportInput,
  ProviderType,
} from '@waflame/shared';
import { csvImportQueue, groupInviteQueue } from '../../lib/queues.js';

export class ImportsService {
  /**
   * Parse headers and preview first few rows of CSV or Excel file
   */
  async previewFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error('File tidak ditemukan di server');
    }

    const ext = path.extname(filePath).toLowerCase();
    let rows: any[][] = [];

    if (ext === '.csv' || ext === '.txt') {
      const content = fs.readFileSync(filePath, 'utf-8');
      rows = parseCsv(content, {
        skip_empty_lines: true,
        trim: true,
      }) as any[][];
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    } else {
      throw new Error('Format file tidak didukung. Harap gunakan file CSV atau Excel (.xlsx/.xls)');
    }

    if (rows.length === 0) {
      throw new Error('File kosong atau tidak memiliki data');
    }

    const headers = (rows[0] || []).map((h: any) => String(h || '').trim());
    const previewRows = rows.slice(1, 6).map((row) => {
      const rowObj: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
      });
      return rowObj;
    });

    // Auto-detect columns
    const phoneCandidate = headers.find((h) =>
      /phone|telepon|hp|wa|nomor|mobile/i.test(h)
    );
    const nameCandidate = headers.find((h) =>
      /nama|name|first/i.test(h)
    );

    return {
      headers,
      preview: previewRows,
      totalRows: Math.max(0, rows.length - 1),
      suggestedMapping: {
        phoneColumn: phoneCandidate || headers[0] || '',
        firstNameColumn: nameCandidate || headers[1] || '',
      },
    };
  }

  /**
   * Enqueue CSV/Excel Contact Import Job
   */
  async createImportJob(tenantId: string, input: ProcessImportInput) {
    if (!fs.existsSync(input.filePath)) {
      throw new Error('File import tidak ditemukan di server');
    }

    const preview = await this.previewFile(input.filePath);

    // Create Import record in database
    const importRecord = await prisma.import.create({
      data: {
        tenantId,
        fileName: input.fileName,
        fileUrl: input.filePath,
        entityType: ImportEntityType.CONTACTS,
        totalRows: preview.totalRows,
        processedRows: 0,
        successRows: 0,
        failedRows: 0,
        status: ImportStatus.PENDING,
        mappingConfig: input.mappingConfig as any,
      },
    });

    // Enqueue to BullMQ
    await csvImportQueue.add(
      'import',
      {
        tenantId,
        importId: importRecord.id,
        filePath: input.filePath,
        mappingConfig: input.mappingConfig,
      },
      {
        jobId: `import_${importRecord.id}`,
      }
    );

    return importRecord;
  }

  /**
   * Enqueue Group Invite from CSV (QR Mode only)
   */
  async createGroupInviteJob(tenantId: string, input: GroupInviteCsvInput) {
    // 1. Check device and ensure it's BAILEYS
    const device = await prisma.device.findFirst({
      where: { id: input.deviceId, tenantId, deletedAt: null },
    });
    if (!device) throw new Error('Perangkat tidak ditemukan');

    if (device.providerType !== ProviderType.BAILEYS) {
      throw new Error(
        'Fitur invite grup dari CSV hanya tersedia untuk perangkat QR Mode (Baileys).'
      );
    }

    if (!fs.existsSync(input.filePath)) {
      throw new Error('File tidak ditemukan di server');
    }

    const preview = await this.previewFile(input.filePath);

    // 2. Create import record
    const importRecord = await prisma.import.create({
      data: {
        tenantId,
        fileName: input.fileName,
        fileUrl: input.filePath,
        entityType: ImportEntityType.GROUP_INVITES,
        totalRows: preview.totalRows,
        processedRows: 0,
        successRows: 0,
        failedRows: 0,
        status: ImportStatus.PENDING,
        mappingConfig: {
          phoneColumn: input.phoneColumn,
          deviceId: input.deviceId,
          groupJid: input.groupJid,
          delaySec: input.delaySec,
        },
      },
    });

    // 3. Enqueue to BullMQ
    await groupInviteQueue.add(
      'group-invite',
      {
        tenantId,
        importId: importRecord.id,
        deviceId: input.deviceId,
        groupJid: input.groupJid,
        filePath: input.filePath,
        phoneColumn: input.phoneColumn,
        delaySec: input.delaySec,
      },
      {
        jobId: `group-invite_${importRecord.id}`,
      }
    );

    return importRecord;
  }

  /**
   * Get single import status
   */
  async getImportStatus(tenantId: string, importId: string) {
    const record = await prisma.import.findFirst({
      where: { id: importId, tenantId },
    });

    if (!record) throw new Error('Catatan import tidak ditemukan');
    return record;
  }

  /**
   * List import histories
   */
  async listImports(tenantId: string) {
    return await prisma.import.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
