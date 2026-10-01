import { prisma } from '@waflame/database';
import {
  CampaignActionInput,
  CampaignRecipientStatus,
  CampaignStatus,
  CreateCampaignInput,
  normalizePhoneNumber,
} from '@waflame/shared';
import { campaignBroadcastQueue } from '../../lib/queues.js';

export class CampaignsService {
  /**
   * List campaigns
   */
  async listCampaigns(tenantId: string) {
    return await prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        device: { select: { id: true, name: true, providerType: true } },
        template: { select: { id: true, name: true, category: true } },
      },
    });
  }

  /**
   * Get single campaign detail
   */
  async getCampaign(tenantId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId },
      include: {
        device: { select: { id: true, name: true, providerType: true } },
        template: { select: { id: true, name: true, category: true, components: true } },
        _count: {
          select: { recipients: true },
        },
      },
    });

    if (!campaign) throw new Error('Kampanye broadcast tidak ditemukan');
    return campaign;
  }

  /**
   * Create campaign and resolve target recipients
   */
  async createCampaign(tenantId: string, input: CreateCampaignInput) {
    // 1. Verify device belongs to tenant
    const device = await prisma.device.findFirst({
      where: { id: input.deviceId, tenantId, deletedAt: null },
    });
    if (!device) throw new Error('Perangkat tidak ditemukan');

    // 2. Resolve recipients from contacts, groups, tags, and custom recipients
    const recipientMap = new Map<string, { contactId?: string; phoneNumber: string }>();

    // Direct contact IDs
    if (input.contactIds && input.contactIds.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          id: { in: input.contactIds },
          tenantId,
          deletedAt: null,
          isBlacklisted: false,
        },
      });
      for (const c of contacts) {
        recipientMap.set(c.phoneNumber, { contactId: c.id, phoneNumber: c.phoneNumber });
      }
    }

    // From groups
    if (input.groupIds && input.groupIds.length > 0) {
      const groupMembers = await prisma.contactGroupMember.findMany({
        where: { contactGroupId: { in: input.groupIds } },
        include: {
          contact: true,
        },
      });
      for (const gm of groupMembers) {
        if (
          gm.contact &&
          gm.contact.tenantId === tenantId &&
          !gm.contact.deletedAt &&
          !gm.contact.isBlacklisted
        ) {
          recipientMap.set(gm.contact.phoneNumber, {
            contactId: gm.contact.id,
            phoneNumber: gm.contact.phoneNumber,
          });
        }
      }
    }

    // From tags
    if (input.tagIds && input.tagIds.length > 0) {
      const tagRelations = await prisma.contactTagRelation.findMany({
        where: { contactTagId: { in: input.tagIds } },
        include: {
          contact: true,
        },
      });
      for (const tr of tagRelations) {
        if (
          tr.contact &&
          tr.contact.tenantId === tenantId &&
          !tr.contact.deletedAt &&
          !tr.contact.isBlacklisted
        ) {
          recipientMap.set(tr.contact.phoneNumber, {
            contactId: tr.contact.id,
            phoneNumber: tr.contact.phoneNumber,
          });
        }
      }
    }

    // From custom recipients
    if (input.customRecipients && input.customRecipients.length > 0) {
      for (const cr of input.customRecipients) {
        const norm = normalizePhoneNumber(cr.phoneNumber);
        if (!recipientMap.has(norm)) {
          recipientMap.set(norm, { phoneNumber: norm });
        }
      }
    }

    const uniqueRecipients = Array.from(recipientMap.values());
    if (uniqueRecipients.length === 0) {
      throw new Error('Tidak ada target penerima yang valid (penerima kosong atau berada di daftar hitam)');
    }

    const isScheduled = input.scheduledAt && new Date(input.scheduledAt) > new Date();

    // 3. Create campaign in DB
    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        deviceId: input.deviceId,
        name: input.name,
        description: input.description || null,
        messageType: input.messageType,
        rawMessage: input.rawMessage || null,
        mediaUrl: input.mediaUrl || null,
        templateId: input.templateId || null,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: isScheduled ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        totalRecipients: uniqueRecipients.length,
        minDelaySec: input.minDelaySec,
        maxDelaySec: input.maxDelaySec,
      },
    });

    // 4. Batch insert recipients in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < uniqueRecipients.length; i += chunkSize) {
      const chunk = uniqueRecipients.slice(i, i + chunkSize);
      await prisma.campaignRecipient.createMany({
        data: chunk.map((r) => ({
          campaignId: campaign.id,
          contactId: r.contactId || null,
          phoneNumber: r.phoneNumber,
          status: CampaignRecipientStatus.PENDING,
        })),
      });
    }

    // 5. If not scheduled, automatically start campaign via BullMQ
    if (!isScheduled) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: CampaignStatus.RUNNING },
      });

      await campaignBroadcastQueue.add(
        'broadcast',
        {
          tenantId,
          campaignId: campaign.id,
        },
        {
          jobId: `campaign_${campaign.id}`,
        }
      );
    }

    return campaign;
  }

  /**
   * Action: START, PAUSE, RESUME, CANCEL
   */
  async triggerAction(tenantId: string, campaignId: string, input: CampaignActionInput) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) throw new Error('Kampanye broadcast tidak ditemukan');

    switch (input.action) {
      case 'START':
      case 'RESUME': {
        if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.CANCELLED) {
          throw new Error(`Kampanye yang sudah ${campaign.status.toLowerCase()} tidak dapat dijalankan kembali`);
        }

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: CampaignStatus.RUNNING },
        });

        await campaignBroadcastQueue.add(
          'broadcast',
          {
            tenantId,
            campaignId,
          },
          {
            jobId: `campaign_${campaignId}_${Date.now()}`,
          }
        );

        return { message: 'Kampanye berhasil dijalankan / dilanjutkan', status: CampaignStatus.RUNNING };
      }

      case 'PAUSE': {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: CampaignStatus.PAUSED },
        });
        return { message: 'Kampanye berhasil dijeda', status: CampaignStatus.PAUSED };
      }

      case 'CANCEL': {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: CampaignStatus.CANCELLED },
        });
        return { message: 'Kampanye berhasil dibatalkan', status: CampaignStatus.CANCELLED };
      }
    }
  }

  /**
   * Get campaign recipients list with pagination
   */
  async getRecipients(tenantId: string, campaignId: string, query: { page?: number; limit?: number; status?: string }) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) throw new Error('Kampanye tidak ditemukan');

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      campaignId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, recipients] = await Promise.all([
      prisma.campaignRecipient.count({ where }),
      prisma.campaignRecipient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          contact: { select: { firstName: true, lastName: true, email: true } },
          message: { select: { id: true, status: true, sentAt: true, deliveredAt: true, readAt: true } },
        },
      }),
    ]);

    return {
      recipients: recipients.map((r) => ({
        ...r,
        id: String(r.id), // BigInt serialization
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
