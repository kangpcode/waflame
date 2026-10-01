import { FastifyReply, FastifyRequest } from 'fastify';
import {
  AssignAgentSchema,
  ConversationFilterQuerySchema,
  InboxReplySchema,
  InternalNoteSchema,
  UpdateConversationStatusSchema,
} from '@waflame/shared';
import { InboxService } from './inbox.service.js';

const inboxService = new InboxService();

export class InboxController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const parse = ConversationFilterQuerySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Parameter filter percakapan tidak valid',
        errors: parse.error.format(),
      });
    }

    const result = await inboxService.listConversations(request.user.tenantId, parse.data);
    return reply.status(200).send({
      success: true,
      data: result.conversations,
      pagination: result.pagination,
    });
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const conversation = await inboxService.getConversation(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: conversation,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  async reply(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = InboxReplySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form pesan balasan gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const message = await inboxService.replyMessage(
        request.user.tenantId,
        request.user.userId,
        id,
        parse.data
      );
      return reply.status(201).send({
        success: true,
        message: 'Balasan pesan berhasil dikirim',
        data: message,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async note(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = InternalNoteSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Catatan internal tidak boleh kosong',
        errors: parse.error.format(),
      });
    }

    try {
      const note = await inboxService.createInternalNote(
        request.user.tenantId,
        request.user.userId,
        id,
        parse.data.content
      );
      return reply.status(201).send({
        success: true,
        message: 'Catatan internal berhasil ditambahkan ke percakapan',
        data: note,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async assign(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = AssignAgentSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Format agen tidak valid',
        errors: parse.error.format(),
      });
    }

    try {
      const updated = await inboxService.assignAgent(
        request.user.tenantId,
        id,
        parse.data.agentId
      );
      return reply.status(200).send({
        success: true,
        message: parse.data.agentId
          ? 'Percakapan berhasil ditugaskan ke agen'
          : 'Penugasan agen pada percakapan berhasil dilepas',
        data: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async status(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = UpdateConversationStatusSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Status percakapan tidak valid',
        errors: parse.error.format(),
      });
    }

    try {
      const updated = await inboxService.updateStatus(
        request.user.tenantId,
        id,
        parse.data.status
      );
      return reply.status(200).send({
        success: true,
        message: `Status percakapan diubah menjadi ${parse.data.status}`,
        data: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
