import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateAutoReplySchema, UpdateAutoReplySchema } from '@waflame/shared';
import { AutoRepliesService } from './auto-replies.service.js';

const autoRepliesService = new AutoRepliesService();

export class AutoRepliesController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const list = await autoRepliesService.list(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: list,
    });
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const item = await autoRepliesService.get(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: item,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parse = CreateAutoReplySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form auto reply gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const item = await autoRepliesService.create(request.user.tenantId, parse.data);
      return reply.status(201).send({
        success: true,
        message: 'Aturan auto reply berhasil dibuat',
        data: item,
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
    const parse = UpdateAutoReplySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form auto reply gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const item = await autoRepliesService.update(request.user.tenantId, id, parse.data);
      return reply.status(200).send({
        success: true,
        message: 'Aturan auto reply berhasil diperbarui',
        data: item,
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
      const res = await autoRepliesService.delete(request.user.tenantId, id);
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
