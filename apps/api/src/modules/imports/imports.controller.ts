import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GroupInviteCsvSchema, ProcessImportSchema } from '@waflame/shared';
import { ImportsService } from './imports.service.js';

const importsService = new ImportsService();

export class ImportsController {
  /**
   * Upload file and return preview with suggested column mapping
   */
  async uploadAndPreview(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        message: 'Tidak ada file yang diunggah',
      });
    }

    const uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFilename = `${request.user.tenantId}_${Date.now()}_${data.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetFilePath = path.join(uploadDir, safeFilename);

    await pipeline(data.file, fs.createWriteStream(targetFilePath));

    try {
      const preview = await importsService.previewFile(targetFilePath);
      return reply.status(200).send({
        success: true,
        message: 'File berhasil diunggah dan diuraikan',
        data: {
          filePath: targetFilePath,
          fileName: data.filename,
          ...preview,
        },
      });
    } catch (err: any) {
      // Remove invalid uploaded file
      if (fs.existsSync(targetFilePath)) fs.unlinkSync(targetFilePath);
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Start contact import queue job
   */
  async processImport(request: FastifyRequest, reply: FastifyReply) {
    const parse = ProcessImportSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Konfigurasi import tidak valid',
        errors: parse.error.format(),
      });
    }

    try {
      const importJob = await importsService.createImportJob(request.user.tenantId, parse.data);
      return reply.status(202).send({
        success: true,
        message: 'Tugas import kontak telah dimasukkan ke dalam antrean (BullMQ)',
        data: importJob,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Start WhatsApp group invite from CSV queue job
   */
  async processGroupInvite(request: FastifyRequest, reply: FastifyReply) {
    const parse = GroupInviteCsvSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Konfigurasi invite grup tidak valid',
        errors: parse.error.format(),
      });
    }

    try {
      const job = await importsService.createGroupInviteJob(request.user.tenantId, parse.data);
      return reply.status(202).send({
        success: true,
        message: 'Tugas invite grup WhatsApp dari CSV telah dimasukkan ke dalam antrean (BullMQ)',
        data: job,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Check import progress / status
   */
  async getStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const record = await importsService.getImportStatus(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: record,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * List all import jobs
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const records = await importsService.listImports(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: records,
    });
  }
}
