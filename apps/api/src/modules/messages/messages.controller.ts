import { FastifyReply, FastifyRequest } from 'fastify';
import { SendMessageSchema } from '@waflame/shared';
import { MessagesService } from './messages.service.js';

const messagesService = new MessagesService();

export class MessagesController {
  /**
   * POST /api/v1/messages/send
   */
  async send(request: FastifyRequest, reply: FastifyReply) {
    const parse = SendMessageSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form pengiriman pesan gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const message = await messagesService.sendMessage(request.user.tenantId, parse.data);
      return reply.status(200).send({
        success: true,
        message: 'Pesan berhasil diproses dan dikirim',
        data: message,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Gagal mengirim pesan',
      });
    }
  }

  /**
   * GET /api/v1/messages
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const result = await messagesService.listMessages(
      request.user.tenantId,
      (request.query as any) || {}
    );
    return reply.status(200).send({
      success: true,
      data: result.messages,
      pagination: result.pagination,
    });
  }

  /**
   * GET /api/v1/messages/:id
   */
  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const message = await messagesService.getMessage(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: message,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }
}
