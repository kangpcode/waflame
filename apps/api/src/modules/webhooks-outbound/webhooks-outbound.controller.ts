import { FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateWebhookSchema,
  TestWebhookSchema,
  UpdateWebhookSchema,
} from '@waflame/shared';
import { WebhooksOutboundService } from './webhooks-outbound.service.js';

const webhooksService = new WebhooksOutboundService();

export class WebhooksOutboundController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const list = await webhooksService.listWebhooks(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: list,
    });
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const webhook = await webhooksService.getWebhook(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: webhook,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parse = CreateWebhookSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form webhook gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const webhook = await webhooksService.createWebhook(
        request.user.tenantId,
        parse.data
      );
      return reply.status(201).send({
        success: true,
        message: 'Webhook outbound berhasil dibuat',
        data: webhook,
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
    const parse = UpdateWebhookSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form webhook gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const webhook = await webhooksService.updateWebhook(
        request.user.tenantId,
        id,
        parse.data
      );
      return reply.status(200).send({
        success: true,
        message: 'Webhook outbound berhasil diperbarui',
        data: webhook,
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
      const res = await webhooksService.deleteWebhook(request.user.tenantId, id);
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

  async test(request: FastifyRequest, reply: FastifyReply) {
    const parse = TestWebhookSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Parameter uji coba webhook tidak valid',
        errors: parse.error.format(),
      });
    }

    const res = await webhooksService.testWebhook(request.user.tenantId, parse.data);
    return reply.status(200).send({
      success: true,
      message: res.message,
      data: res,
    });
  }

  async logs(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const logs = await webhooksService.listLogs(request.user.tenantId, id);
    return reply.status(200).send({
      success: true,
      data: logs.map((log) => ({
        ...log,
        id: String(log.id), // BigInt serialization
      })),
    });
  }
}
