import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { TemplatesService } from './templates.service.js';

const templatesService = new TemplatesService();

const CreateTemplateSchema = z.object({
  deviceId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']).default('MARKETING'),
  language: z.string().default('id'),
  components: z.array(z.any()),
});

export class TemplatesController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { deviceId } = (request.query as any) || {};
    const templates = await templatesService.listTemplates(request.user.tenantId, deviceId);
    return reply.status(200).send({
      success: true,
      data: templates,
    });
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const template = await templatesService.getTemplate(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: template,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parse = CreateTemplateSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form template gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const template = await templatesService.createTemplate(request.user.tenantId, parse.data);
      return reply.status(201).send({
        success: true,
        message: 'Template berhasil dibuat',
        data: template,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async sync(request: FastifyRequest, reply: FastifyReply) {
    const { deviceId } = (request.body as any) || {};
    if (!deviceId) {
      return reply.status(400).send({
        success: false,
        message: 'deviceId wajib disertakan untuk sinkronisasi template',
      });
    }

    try {
      const result = await templatesService.syncFromMeta(request.user.tenantId, deviceId);
      return reply.status(200).send({
        success: true,
        message: `Berhasil menyinkronkan ${result.syncedCount} template dari Meta Cloud API`,
        data: result,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
