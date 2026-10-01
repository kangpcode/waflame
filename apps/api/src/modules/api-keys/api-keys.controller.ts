import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateApiKeySchema, UpdateApiKeySchema } from '@waflame/shared';
import { ApiKeysService } from './api-keys.service.js';

const apiKeysService = new ApiKeysService();

export class ApiKeysController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const list = await apiKeysService.listApiKeys(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: list,
    });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parse = CreateApiKeySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form API Key gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const apiKey = await apiKeysService.createApiKey(
        request.user.tenantId,
        parse.data
      );
      return reply.status(201).send({
        success: true,
        message: 'API Key berhasil dibuat. Simpan kunci ini sekarang karena tidak akan ditampilkan lagi!',
        data: apiKey,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = UpdateApiKeySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form API Key gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const updated = await apiKeysService.updateApiKey(
        request.user.tenantId,
        id,
        parse.data
      );
      return reply.status(200).send({
        success: true,
        message: 'API Key berhasil diperbarui',
        data: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const res = await apiKeysService.deleteApiKey(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        message: res.message,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
