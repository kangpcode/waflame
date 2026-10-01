import { FastifyReply, FastifyRequest } from 'fastify';
import {
  BlacklistContactSchema,
  ContactFilterQuerySchema,
  ContactGroupSchema,
  ContactTagSchema,
  CreateContactSchema,
  UpdateContactSchema,
} from '@waflame/shared';
import { ContactsService } from './contacts.service.js';

const contactsService = new ContactsService();

export class ContactsController {
  // ---------------- Contacts ----------------
  async list(request: FastifyRequest, reply: FastifyReply) {
    const parse = ContactFilterQuerySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Parameter filter tidak valid',
        errors: parse.error.format(),
      });
    }

    const data = await contactsService.listContacts(request.user.tenantId, parse.data);
    return reply.status(200).send({
      success: true,
      data: data.contacts,
      pagination: data.pagination,
    });
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const contact = await contactsService.getContact(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: contact,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parse = CreateContactSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi data kontak gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const contact = await contactsService.createContact(request.user.tenantId, parse.data);
      return reply.status(201).send({
        success: true,
        message: 'Kontak berhasil ditambahkan',
        data: contact,
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
    const parse = UpdateContactSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi data kontak gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const contact = await contactsService.updateContact(request.user.tenantId, id, parse.data);
      return reply.status(200).send({
        success: true,
        message: 'Kontak berhasil diperbarui',
        data: contact,
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
      const res = await contactsService.deleteContact(request.user.tenantId, id);
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

  async setBlacklist(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = BlacklistContactSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi blacklist gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const contact = await contactsService.setBlacklist(request.user.tenantId, id, parse.data);
      return reply.status(200).send({
        success: true,
        message: parse.data.isBlacklisted
          ? 'Kontak berhasil dimasukkan ke daftar hitam'
          : 'Kontak berhasil dihapus dari daftar hitam',
        data: contact,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  // ---------------- Groups ----------------
  async listGroups(request: FastifyRequest, reply: FastifyReply) {
    const groups = await contactsService.listGroups(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: groups,
    });
  }

  async createGroup(request: FastifyRequest, reply: FastifyReply) {
    const parse = ContactGroupSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form grup gagal',
        errors: parse.error.format(),
      });
    }

    const group = await contactsService.createGroup(request.user.tenantId, parse.data);
    return reply.status(201).send({
      success: true,
      message: 'Grup kontak berhasil dibuat',
      data: group,
    });
  }

  async updateGroup(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = ContactGroupSchema.partial().safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form grup gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const group = await contactsService.updateGroup(request.user.tenantId, id, parse.data);
      return reply.status(200).send({
        success: true,
        message: 'Grup kontak berhasil diperbarui',
        data: group,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async deleteGroup(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const res = await contactsService.deleteGroup(request.user.tenantId, id);
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

  // ---------------- Tags ----------------
  async listTags(request: FastifyRequest, reply: FastifyReply) {
    const tags = await contactsService.listTags(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: tags,
    });
  }

  async createTag(request: FastifyRequest, reply: FastifyReply) {
    const parse = ContactTagSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi tag gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const tag = await contactsService.createTag(request.user.tenantId, parse.data);
      return reply.status(201).send({
        success: true,
        message: 'Tag berhasil dibuat',
        data: tag,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async deleteTag(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const res = await contactsService.deleteTag(request.user.tenantId, id);
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
