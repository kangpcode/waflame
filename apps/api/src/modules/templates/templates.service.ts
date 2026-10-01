import { prisma } from '@waflame/database';
import { decryptAES256 } from '@waflame/shared';
import { OfficialCloudProvider } from '@waflame/wa-core';
import { env } from '../../config/env.js';

export class TemplatesService {
  /**
   * Helper to create OfficialCloudProvider instance for a device
   */
  private getOfficialProvider(device: any): OfficialCloudProvider {
    if (!device.wabaId || !device.phoneNumberId || !device.accessToken) {
      throw new Error('Kredensial Official Meta Cloud API pada perangkat tidak lengkap');
    }

    const wabaId = decryptAES256(device.wabaId, env.ENCRYPTION_KEY);
    const phoneNumberId = decryptAES256(device.phoneNumberId, env.ENCRYPTION_KEY);
    const accessToken = decryptAES256(device.accessToken, env.ENCRYPTION_KEY);

    return new OfficialCloudProvider({
      deviceId: device.id,
      wabaId,
      phoneNumberId,
      accessToken,
      apiVersion: env.META_API_VERSION,
    });
  }

  /**
   * List templates for tenant
   */
  async listTemplates(tenantId: string, deviceId?: string) {
    return await prisma.template.findMany({
      where: {
        tenantId,
        ...(deviceId ? { deviceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        device: { select: { id: true, name: true, providerType: true } },
      },
    });
  }

  /**
   * Get single template detail
   */
  async getTemplate(tenantId: string, templateId: string) {
    const template = await prisma.template.findFirst({
      where: { id: templateId, tenantId },
      include: {
        device: { select: { id: true, name: true, providerType: true } },
      },
    });

    if (!template) throw new Error('Template tidak ditemukan');
    return template;
  }

  /**
   * Create template (and push to Meta if device is Official)
   */
  async createTemplate(
    tenantId: string,
    data: {
      deviceId?: string;
      name: string;
      category: string;
      language?: string;
      components: any[];
    }
  ) {
    let metaTemplateId: string | undefined;
    let initialStatus = 'DRAFT';

    if (data.deviceId) {
      const device = await prisma.device.findFirst({
        where: { id: data.deviceId, tenantId, deletedAt: null },
      });

      if (device && device.providerType === 'OFFICIAL') {
        const provider = this.getOfficialProvider(device);
        try {
          const metaRes = await provider.createTemplate({
            name: data.name.toLowerCase().replace(/\s+/g, '_'),
            category: data.category.toUpperCase(),
            language: data.language || 'id',
            components: data.components,
          });
          metaTemplateId = metaRes.id;
          initialStatus = 'PENDING';
        } catch (err: any) {
          throw new Error(`Gagal mendaftarkan template ke Meta: ${err.message}`);
        }
      }
    }

    return await prisma.template.create({
      data: {
        tenantId,
        deviceId: data.deviceId || null,
        name: data.name,
        category: data.category.toUpperCase(),
        language: data.language || 'id',
        components: data.components,
        status: initialStatus,
        metaTemplateId,
      },
    });
  }

  /**
   * Sync official templates from Meta Graph API to database
   */
  async syncFromMeta(tenantId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');
    if (device.providerType !== 'OFFICIAL') {
      throw new Error('Hanya perangkat Official WABA yang mendukung sinkronisasi template Meta');
    }

    const provider = this.getOfficialProvider(device);
    const metaTemplates = await provider.fetchTemplates();

    let syncedCount = 0;

    for (const mt of metaTemplates) {
      const statusMap: Record<string, string> = {
        APPROVED: 'APPROVED',
        PENDING: 'PENDING',
        REJECTED: 'REJECTED',
        PAUSED: 'PAUSED',
        DISABLED: 'REJECTED',
      };

      const normalizedStatus = statusMap[mt.status] || 'PENDING';

      const existing = await prisma.template.findFirst({
        where: {
          tenantId,
          deviceId: device.id,
          name: mt.name,
        },
      });

      if (existing) {
        await prisma.template.update({
          where: { id: existing.id },
          data: {
            category: mt.category,
            language: mt.language,
            components: mt.components || [],
            status: normalizedStatus,
            metaTemplateId: mt.id,
            rejectionReason: mt.rejected_reason || null,
          },
        });
      } else {
        await prisma.template.create({
          data: {
            tenantId,
            deviceId: device.id,
            name: mt.name,
            category: mt.category,
            language: mt.language,
            components: mt.components || [],
            status: normalizedStatus,
            metaTemplateId: mt.id,
            rejectionReason: mt.rejected_reason || null,
          },
        });
      }
      syncedCount++;
    }

    return {
      syncedCount,
      totalTemplates: metaTemplates.length,
    };
  }
}
