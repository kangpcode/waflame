import { Job, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '@waflame/database';
import {
  MessageDirection,
  MessageSendJobData,
  MessageStatus,
  MessageType,
  MessageTypeValue,
  QueueName,
  decryptAES256,
  toWhatsAppJid,
} from '@waflame/shared';
import { OfficialCloudProvider, sessionManager, WhatsAppProvider } from '@waflame/wa-core';
import { env } from '../config/env.js';

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export function createMessageSendWorker() {
  const worker = new Worker<MessageSendJobData>(
    QueueName.MESSAGE_SEND,
    async (job: Job<MessageSendJobData>) => {
      const { tenantId, messageId, deviceId, to, type, text, mediaUrl, templateId, templateParams } =
        job.data;

      console.log(`[Worker:MessageSend] Processing message ${messageId} to ${to}`);

      // 1. Get device
      const device = await prisma.device.findFirst({
        where: { id: deviceId, tenantId, deletedAt: null },
      });

      if (!device) {
        throw new Error('Perangkat pengirim tidak ditemukan');
      }

      const remoteJid = toWhatsAppJid(to);

      let provider: WhatsAppProvider;

      if (device.providerType === 'OFFICIAL') {
        if (!device.wabaId || !device.phoneNumberId || !device.accessToken) {
          throw new Error('Kredensial Meta Cloud API tidak lengkap');
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
        const baileys = sessionManager.getSession(device.id);
        if (!baileys || baileys.status !== 'CONNECTED') {
          throw new Error(`Sesi perangkat ${device.name} belum terhubung`);
        }
        provider = baileys;
      }

      let templateObj: any = null;
      if (type === MessageType.TEMPLATE && templateId) {
        templateObj = await prisma.template.findFirst({ where: { id: templateId, tenantId } });
        if (!templateObj) throw new Error('Template pesan tidak ditemukan');
      }

      const sendResult = await provider.sendMessage({
        to: remoteJid,
        type: type as MessageTypeValue,
        content: text,
        mediaUrl: mediaUrl || undefined,
        caption: text,
        templateName: templateObj?.name,
        templateLanguage: templateObj?.language,
        templateComponents: templateParams
          ? [
              {
                type: 'body',
                parameters: templateParams.map((p) => ({ type: 'text', text: p })),
              },
            ]
          : undefined,
      });

      // Update message status to SENT
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: MessageStatus.SENT,
          externalMessageId: sendResult?.id || null,
          sentAt: new Date(),
        },
      });

      console.log(`[Worker:MessageSend] Message ${messageId} successfully sent.`);
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on('failed', async (job, err) => {
    console.error(`[Worker:MessageSend] Job ${job?.id} failed:`, err.message);
    if (job?.data?.messageId) {
      await prisma.message.update({
        where: { id: job.data.messageId },
        data: {
          status: MessageStatus.FAILED,
          errorMessage: err.message?.substring(0, 250),
        },
      });
    }
  });

  return worker;
}
