import { prisma } from '@waflame/database';
import {
  BlacklistContactInput,
  ContactFilterQuery,
  ContactGroupInput,
  ContactTagInput,
  CreateContactInput,
  UpdateContactInput,
  normalizePhoneNumber,
} from '@waflame/shared';

export class ContactsService {
  /**
   * List contacts with filtering and pagination
   */
  async listContacts(tenantId: string, query: ContactFilterQuery) {
    const { search, groupId, tagId, isBlacklisted, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(isBlacklisted !== undefined ? { isBlacklisted } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { phoneNumber: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
      ...(groupId
        ? {
            groupMembers: {
              some: { contactGroupId: groupId },
            },
          }
        : {}),
      ...(tagId
        ? {
            tagRelations: {
              some: { contactTagId: tagId },
            },
          }
        : {}),
    };

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          groupMembers: {
            include: { group: true },
          },
          tagRelations: {
            include: { tag: true },
          },
        },
      }),
    ]);

    return {
      contacts: contacts.map((c) => ({
        ...c,
        groups: c.groupMembers.map((gm) => gm.group),
        tags: c.tagRelations.map((tr) => tr.tag),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single contact detail
   */
  async getContact(tenantId: string, id: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        groupMembers: { include: { group: true } },
        tagRelations: { include: { tag: true } },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!contact) throw new Error('Kontak tidak ditemukan');

    return {
      ...contact,
      groups: contact.groupMembers.map((gm) => gm.group),
      tags: contact.tagRelations.map((tr) => tr.tag),
    };
  }

  /**
   * Create contact
   */
  async createContact(tenantId: string, input: CreateContactInput) {
    // 1. Check tenant quota
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { _count: { select: { contacts: { where: { deletedAt: null } } } } },
    });

    if (!tenant) throw new Error('Tenant tidak ditemukan');
    if (tenant._count.contacts >= tenant.maxContacts) {
      throw new Error(
        `Batas kuota kontak tercapai (${tenant._count.contacts}/${tenant.maxContacts}). Silakan upgrade paket Anda.`
      );
    }

    // 2. Normalize phone
    const normalizedPhone = normalizePhoneNumber(input.phoneNumber);

    // 3. Deduplication check
    const existing = await prisma.contact.findFirst({
      where: {
        tenantId,
        phoneNumber: normalizedPhone,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new Error(`Kontak dengan nomor telepon ${normalizedPhone} sudah terdaftar.`);
    }

    // 4. Create contact
    return await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          tenantId,
          firstName: input.firstName,
          lastName: input.lastName || null,
          phoneNumber: normalizedPhone,
          email: input.email || null,
          customFields: input.customFields || {},
        },
      });

      if (input.groupIds && input.groupIds.length > 0) {
        await tx.contactGroupMember.createMany({
          data: input.groupIds.map((groupId) => ({
            contactId: contact.id,
            contactGroupId: groupId,
          })),
          skipDuplicates: true,
        });
      }

      if (input.tagIds && input.tagIds.length > 0) {
        await tx.contactTagRelation.createMany({
          data: input.tagIds.map((tagId) => ({
            contactId: contact.id,
            contactTagId: tagId,
          })),
          skipDuplicates: true,
        });
      }

      return contact;
    });
  }

  /**
   * Update contact
   */
  async updateContact(tenantId: string, id: string, input: UpdateContactInput) {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!contact) throw new Error('Kontak tidak ditemukan');

    const updateData: any = {};
    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.customFields !== undefined) updateData.customFields = input.customFields;

    if (input.phoneNumber) {
      const normalized = normalizePhoneNumber(input.phoneNumber);
      if (normalized !== contact.phoneNumber) {
        const conflict = await prisma.contact.findFirst({
          where: {
            tenantId,
            phoneNumber: normalized,
            deletedAt: null,
            NOT: { id },
          },
        });
        if (conflict) {
          throw new Error(`Nomor telepon ${normalized} sudah digunakan oleh kontak lain`);
        }
        updateData.phoneNumber = normalized;
      }
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.contact.update({
        where: { id },
        data: updateData,
      });

      if (input.groupIds !== undefined) {
        await tx.contactGroupMember.deleteMany({ where: { contactId: id } });
        if (input.groupIds.length > 0) {
          await tx.contactGroupMember.createMany({
            data: input.groupIds.map((gid) => ({ contactId: id, contactGroupId: gid })),
            skipDuplicates: true,
          });
        }
      }

      if (input.tagIds !== undefined) {
        await tx.contactTagRelation.deleteMany({ where: { contactId: id } });
        if (input.tagIds.length > 0) {
          await tx.contactTagRelation.createMany({
            data: input.tagIds.map((tid) => ({ contactId: id, contactTagId: tid })),
            skipDuplicates: true,
          });
        }
      }

      return updated;
    });
  }

  /**
   * Soft delete contact
   */
  async deleteContact(tenantId: string, id: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!contact) throw new Error('Kontak tidak ditemukan');

    await prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Kontak berhasil dihapus' };
  }

  /**
   * Blacklist / whitelist contact
   */
  async setBlacklist(tenantId: string, id: string, input: BlacklistContactInput) {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!contact) throw new Error('Kontak tidak ditemukan');

    return await prisma.contact.update({
      where: { id },
      data: {
        isBlacklisted: input.isBlacklisted,
        blacklistReason: input.isBlacklisted ? input.reason || 'Manual blacklist' : null,
      },
    });
  }

  // -------------------------------------------------------------
  // Contact Groups CRUD
  // -------------------------------------------------------------
  async listGroups(tenantId: string) {
    return await prisma.contactGroup.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createGroup(tenantId: string, input: ContactGroupInput) {
    return await prisma.contactGroup.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description || null,
        color: input.color,
      },
    });
  }

  async updateGroup(tenantId: string, id: string, input: Partial<ContactGroupInput>) {
    const group = await prisma.contactGroup.findFirst({
      where: { id, tenantId },
    });
    if (!group) throw new Error('Grup kontak tidak ditemukan');

    return await prisma.contactGroup.update({
      where: { id },
      data: input,
    });
  }

  async deleteGroup(tenantId: string, id: string) {
    const group = await prisma.contactGroup.findFirst({
      where: { id, tenantId },
    });
    if (!group) throw new Error('Grup kontak tidak ditemukan');

    await prisma.contactGroup.delete({ where: { id } });
    return { message: 'Grup kontak berhasil dihapus' };
  }

  // -------------------------------------------------------------
  // Contact Tags CRUD
  // -------------------------------------------------------------
  async listTags(tenantId: string) {
    return await prisma.contactTag.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { relations: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createTag(tenantId: string, input: ContactTagInput) {
    const existing = await prisma.contactTag.findFirst({
      where: { tenantId, name: input.name },
    });
    if (existing) throw new Error(`Tag "${input.name}" sudah ada`);

    return await prisma.contactTag.create({
      data: {
        tenantId,
        name: input.name,
        color: input.color,
      },
    });
  }

  async deleteTag(tenantId: string, id: string) {
    const tag = await prisma.contactTag.findFirst({
      where: { id, tenantId },
    });
    if (!tag) throw new Error('Tag tidak ditemukan');

    await prisma.contactTag.delete({ where: { id } });
    return { message: 'Tag berhasil dihapus' };
  }
}
