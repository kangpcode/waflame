import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@waflame/database';
import {
  ContactFilterQuerySchema,
  CreateContactSchema,
  SendMessageSchema,
} from '@waflame/shared';
import { ContactsService } from '../contacts/contacts.service.js';
import { MessagesService } from '../messages/messages.service.js';

const messagesService = new MessagesService();
const contactsService = new ContactsService();

export class PublicApiController {
  /**
   * Send WhatsApp message via Public API Key
   */
  async sendMessage(request: FastifyRequest, reply: FastifyReply) {
    const tenantId = (request as any).tenantId as string;
    const parse = SendMessageSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form pengiriman pesan gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const result = await messagesService.sendMessage(tenantId, parse.data);
      return reply.status(200).send({
        success: true,
        message: 'Pesan berhasil diproses dan dikirim',
        data: result,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * List devices for tenant
   */
  async listDevices(request: FastifyRequest, reply: FastifyReply) {
    const tenantId = (request as any).tenantId as string;
    const devices = await prisma.device.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        providerType: true,
        status: true,
        lastConnectedAt: true,
        lastActiveAt: true,
      },
    });

    return reply.status(200).send({
      success: true,
      data: devices,
    });
  }

  /**
   * List contacts for tenant
   */
  async listContacts(request: FastifyRequest, reply: FastifyReply) {
    const tenantId = (request as any).tenantId as string;
    const parse = ContactFilterQuerySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Parameter filter kontak tidak valid',
        errors: parse.error.format(),
      });
    }

    const result = await contactsService.listContacts(tenantId, parse.data);
    return reply.status(200).send({
      success: true,
      data: result.contacts,
      pagination: result.pagination,
    });
  }

  /**
   * Create contact via Public API
   */
  async createContact(request: FastifyRequest, reply: FastifyReply) {
    const tenantId = (request as any).tenantId as string;
    const parse = CreateContactSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form data kontak gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const contact = await contactsService.createContact(tenantId, parse.data);
      return reply.status(201).send({
        success: true,
        message: 'Kontak berhasil dibuat',
        data: contact,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
