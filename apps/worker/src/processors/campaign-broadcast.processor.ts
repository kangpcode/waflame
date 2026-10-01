import { Job, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '@waflame/database';
import {
  CampaignBroadcastJobData,
  CampaignRecipientStatus,
  CampaignStatus,
  MessageDirection,
  MessageStatus,
  MessageType,
  MessageTypeValue,
  QueueName,
  decryptAES256,
  parseSpintax,
  toWhatsAppJid,
} from '@waflame/shared';
import { OfficialCloudProvider, sessionManager, WhatsAppProvider } from '@waflame/wa-core';
import { env } from '../config/env.js';

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const pubRedis = new Redis(env.REDIS_URL);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getRandomDelayMs(minSec: number, maxSec: number): number {
  const min = Math.max(1, minSec) * 1000;
  const max = Math.max(minSec, maxSec) * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createCampaignBroadcastWorker() {
  const worker = new Worker<CampaignBroadcastJobData>(
    QueueName.CAMPAIGN_BROADCAST,
    async (job: Job<CampaignBroadcastJobData>) => {
      const { tenantId, campaignId } = job.data;
      console.log(`[Worker:Campaign] Starting broadcast execution for campaign ${campaignId}`);

      // 1. Fetch Campaign & Device details
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, tenantId },
        include: {
          device: true,
          template: true,
        },
      });

      if (!campaign) {
        console.warn(`[Worker:Campaign] Campaign ${campaignId} not found`);
        return;
      }

      if (campaign.status === CampaignStatus.PAUSED || campaign.status === CampaignStatus.CANCELLED) {
        console.log(`[Worker:Campaign] Campaign ${campaignId} is ${campaign.status}, halting.`);
        return;
      }

      const device = campaign.device;
      if (!device) {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: CampaignStatus.PAUSED },
        });
        throw new Error('Perangkat pengirim tidak ditemukan');
      }

      // 2. Prepare Provider
      let provider: WhatsAppProvider;

      if (device.providerType === 'OFFICIAL') {
        if (!device.wabaId || !device.phoneNumberId || !device.accessToken) {
          throw new Error('Kredensial Meta Cloud API pada perangkat tidak lengkap');
        }
        const wabaId = decryptAES256(device.wabaId, env.ENCRYPTION_KEY);
        const phoneNumberId = decryptAES256(device.phoneNumberId, env.ENCRYPTION_KEY);
        const accessToken = decryptAES256(device.accessToken, env.ENCRYPTION_KEY);

        provider = new OfficialCloudProvider({
          deviceId: device.id,
          wabaId,
          phoneNumberId,
          accessToken,
          apiVersion: env.META_API_VERSION,
        });
      } else {
        const baileysSession = sessionManager.getSession(device.id);
        if (!baileysSession || baileysSession.status !== 'CONNECTED') {
          throw new Error(`Sesi perangkat ${device.name} sedang tidak terhubung (${device.status})`);
        }
        provider = baileysSession;
      }

      // 3. Process recipients in batches of 20
      const batchSize = 20;
      let hasMore = true;

      while (hasMore) {
        // Re-check campaign status before next batch
        const currentCampaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { status: true },
        });

        if (
          !currentCampaign ||
          currentCampaign.status === CampaignStatus.PAUSED ||
          currentCampaign.status === CampaignStatus.CANCELLED
        ) {
          console.log(`[Worker:Campaign] Campaign ${campaignId} was paused or cancelled by user.`);
          return;
        }

        const recipients = await prisma.campaignRecipient.findMany({
          where: {
            campaignId,
            status: CampaignRecipientStatus.PENDING,
          },
          take: batchSize,
          include: {
            contact: true,
          },
        });

        if (recipients.length === 0) {
          hasMore = false;
          break;
        }

        for (const recipient of recipients) {
          // Re-check pause status between messages
          const freshStatus = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { status: true },
          });
          if (freshStatus?.status === CampaignStatus.PAUSED || freshStatus?.status === CampaignStatus.CANCELLED) {
            console.log(`[Worker:Campaign] Halting campaign loop due to status: ${freshStatus.status}`);
            return;
          }

          const contactName = recipient.contact?.firstName || 'Pelanggan';
          const contactFullName = `${recipient.contact?.firstName || ''} ${recipient.contact?.lastName || ''}`.trim() || 'Pelanggan';
          const recipientPhone = recipient.phoneNumber;

          // Message Personalization & Spintax
          let content = campaign.rawMessage || '';
          content = content
            .replace(/\{\{nama\}\}/gi, contactName)
            .replace(/\{\{name\}\}/gi, contactFullName)
            .replace(/\{\{nomor\}\}/gi, recipientPhone)
            .replace(/\{\{phone\}\}/gi, recipientPhone);

          // Custom fields replacement
          if (recipient.contact?.customFields) {
            const fields = recipient.contact.customFields as Record<string, any>;
            for (const [key, val] of Object.entries(fields)) {
              const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
              content = content.replace(regex, String(val || ''));
            }
          }

          // Spintax parse: {Halo|Hai|Selamat pagi}
          content = parseSpintax(content);

          const remoteJid = toWhatsAppJid(recipientPhone);

          try {
            const sendResult = await provider.sendMessage({
              to: remoteJid,
              type: campaign.messageType as MessageTypeValue,
              content,
              mediaUrl: campaign.mediaUrl || undefined,
              templateName: campaign.template?.name,
              templateLanguage: campaign.template?.language,
              templateComponents: campaign.templateId && campaign.template
                ? [
                    {
                      type: 'body',
                      parameters: [{ type: 'text', text: contactName }],
                    },
                  ]
                : undefined,
            });

            // Record sent message
            const message = await prisma.message.create({
              data: {
                tenantId,
                deviceId: device.id,
                direction: MessageDirection.OUTBOUND,
                remoteJid,
                messageType: campaign.messageType,
                content,
                mediaUrl: campaign.mediaUrl,
                status: MessageStatus.SENT,
                externalMessageId: sendResult?.id || null,
                sentAt: new Date(),
              },
            });

            // Update recipient status
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: CampaignRecipientStatus.SENT,
                sentAt: new Date(),
                messageId: message.id,
              },
            });

            // Increment campaign sent count
            await prisma.campaign.update({
              where: { id: campaignId },
              data: { sentCount: { increment: 1 } },
            });
          } catch (err: any) {
            console.error(`[Worker:Campaign] Failed sending to ${recipientPhone}:`, err.message);

            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: CampaignRecipientStatus.FAILED,
                errorMessage: err.message?.substring(0, 250),
              },
            });

            await prisma.campaign.update({
              where: { id: campaignId },
              data: { failedCount: { increment: 1 } },
            });
          }

          // Publish real-time campaign progress to Redis
          const updatedCampaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: {
              totalRecipients: true,
              sentCount: true,
              failedCount: true,
              status: true,
            },
          });

          await pubRedis.publish(
            `tenant:${tenantId}:campaigns`,
            JSON.stringify({
              campaignId,
              ...updatedCampaign,
            })
          );

          // Anti-banned human randomized delay
          const delayMs = getRandomDelayMs(campaign.minDelaySec, campaign.maxDelaySec);
          await sleep(delayMs);
        }
      }

      // 4. Mark campaign as COMPLETED
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.COMPLETED },
      });

      await pubRedis.publish(
        `tenant:${tenantId}:campaigns`,
        JSON.stringify({
          campaignId,
          status: CampaignStatus.COMPLETED,
          completedAt: new Date().toISOString(),
        })
      );

      console.log(`[Worker:Campaign] Completed broadcast for campaign ${campaignId}`);
    },
    {
      connection: redis,
      concurrency: 3,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker:Campaign] Job ${job?.id} failed:`, err);
  });

  return worker;
}
