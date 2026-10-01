import { prisma } from '@waflame/database';
import {
  CreateWebhookInput,
  TestWebhookInput,
  UpdateWebhookInput,
} from '@waflame/shared';
import { webhookOutboundQueue } from '../../lib/queues.js';

export class WebhooksOutboundService {
  async listWebhooks(tenantId: string) {
    return await prisma.webhook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { logs: true } },
      },
    });
  }

  async getWebhook(tenantId: string, id: string) {
    const webhook = await prisma.webhook.findFirst({
      where: { id, tenantId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!webhook) throw new Error('Webhook tidak ditemukan');
    return webhook;
  }

  async createWebhook(tenantId: string, input: CreateWebhookInput) {
    return await prisma.webhook.create({
      data: {
        tenantId,
        name: input.name,
        url: input.url,
        secretKey: input.secretKey,
        events: input.events,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateWebhook(tenantId: string, id: string, input: UpdateWebhookInput) {
    const webhook = await prisma.webhook.findFirst({ where: { id, tenantId } });
    if (!webhook) throw new Error('Webhook tidak ditemukan');

    return await prisma.webhook.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.secretKey !== undefined ? { secretKey: input.secretKey } : {}),
        ...(input.events !== undefined ? { events: input.events } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  async deleteWebhook(tenantId: string, id: string) {
    const webhook = await prisma.webhook.findFirst({ where: { id, tenantId } });
    if (!webhook) throw new Error('Webhook tidak ditemukan');

    await prisma.webhook.delete({ where: { id } });
    return { message: 'Webhook berhasil dihapus' };
  }

  async testWebhook(tenantId: string, input: TestWebhookInput) {
    const payload = {
      event: input.event,
      timestamp: new Date().toISOString(),
      tenantId,
      data: {
        test: true,
        message: 'Ini adalah ping webhook uji coba dari platform Waflame.',
      },
    };

    const job = await webhookOutboundQueue.add(
      'dispatch',
      {
        tenantId,
        webhookId: input.webhookId || 'test-ping',
        url: input.url,
        secretKey: input.secretKey,
        event: input.event,
        payload,
      },
      {
        jobId: `test_webhook_${Date.now()}`,
      }
    );

    return {
      message: 'Uji coba webhook telah dikirim ke antrean pengiriman',
      jobId: job.id,
      payload,
    };
  }

  async listLogs(tenantId: string, webhookId: string) {
    return await prisma.webhookLog.findMany({
      where: { webhookId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Helper to broadcast event to all subscribed webhooks for a tenant
   */
  async dispatchEvent(tenantId: string, event: string, data: any) {
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId, isActive: true },
    });

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      tenantId,
      data,
    };

    for (const hook of webhooks) {
      const subscribedEvents = (hook.events as string[]) || [];
      if (subscribedEvents.includes(event)) {
        await webhookOutboundQueue.add(
          'dispatch',
          {
            tenantId,
            webhookId: hook.id,
            url: hook.url,
            secretKey: hook.secretKey,
            event,
            payload,
          },
          {
            jobId: `webhook_${hook.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          }
        );
      }
    }
  }
}
