import crypto from 'node:crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@waflame/database';
import {
  MessageDirection,
  MessageStatus,
  MessageStatusValue,
  decryptAES256,
  toWhatsAppJid,
} from '@waflame/shared';
import { env } from '../../config/env.js';

export function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const expectedHash = signatureHeader.slice(7);
  const hmac = crypto.createHmac('sha256', appSecret);
  const computedHash = hmac.update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch (e) {
    return false;
  }
}

export class MetaWebhookController {
  /**
   * GET /api/v1/webhooks/meta - Webhook challenge verification for Meta
   */
  async verifyChallenge(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string>;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
      request.log.info('✅ Meta Webhook challenge verified successfully');
      return reply.status(200).send(challenge);
    }

    request.log.warn('❌ Meta Webhook verification failed: token mismatch');
    return reply.status(403).send('Verification token mismatch');
  }

  /**
   * POST /api/v1/webhooks/meta - Receiver for inbound messages & delivery status updates
   */
  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    // 1. Signature Verification (bypassed in test environment if secret is placeholder)
    const signature = request.headers['x-hub-signature-256'] as string | undefined;
    if (env.META_APP_SECRET !== 'placeholder') {
      const rawBody = JSON.stringify(request.body);
      const isValid = verifyMetaSignature(rawBody, signature, env.META_APP_SECRET);
      if (!isValid) {
        request.log.warn('❌ Meta Webhook invalid signature');
        return reply.status(401).send({ error: 'Invalid HMAC signature' });
      }
    }

    const payload = request.body as any;
    if (!payload?.entry) {
      return reply.status(200).send({ received: true });
    }

    // Process entries asynchronously
    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const val = change.value;
        const phoneNumberId = val?.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        // Find device by matching decrypted phoneNumberId or phone
        const devices = await prisma.device.findMany({
          where: {
            providerType: 'OFFICIAL',
            deletedAt: null,
          },
        });

        let matchedDevice = null;
        for (const dev of devices) {
          if (dev.phoneNumberId) {
            try {
              const decId = decryptAES256(dev.phoneNumberId, env.ENCRYPTION_KEY);
              if (decId === phoneNumberId) {
                matchedDevice = dev;
                break;
              }
            } catch (e) {
              // ignore decryption error
            }
          }
        }

        if (!matchedDevice) {
          request.log.warn(`No official device found matching phone_number_id: ${phoneNumberId}`);
          continue;
        }

        // 2. Handle Inbound Messages
        if (val.messages && val.messages.length > 0) {
          for (const msg of val.messages) {
            const senderPhone = msg.from;
            const targetJid = toWhatsAppJid(senderPhone);
            let content = '';
            let messageType = 'TEXT';
            let mediaUrl: string | undefined;

            if (msg.type === 'text') {
              content = msg.text?.body || '';
              messageType = 'TEXT';
            } else if (msg.type === 'image') {
              content = msg.image?.caption || '';
              messageType = 'IMAGE';
            } else if (msg.type === 'video') {
              content = msg.video?.caption || '';
              messageType = 'VIDEO';
            } else if (msg.type === 'audio') {
              messageType = 'AUDIO';
            } else if (msg.type === 'document') {
              content = msg.document?.filename || '';
              messageType = 'DOCUMENT';
            } else if (msg.type === 'location') {
              content = msg.location?.name || `${msg.location?.latitude}, ${msg.location?.longitude}`;
              messageType = 'LOCATION';
            } else if (msg.type === 'interactive') {
              content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
              messageType = 'INTERACTIVE';
            }

            // Find or create conversation
            let conversation = await prisma.conversation.findFirst({
              where: {
                tenantId: matchedDevice.tenantId,
                deviceId: matchedDevice.id,
                remoteJid: targetJid,
              },
            });

            if (!conversation) {
              const contact = await prisma.contact.findFirst({
                where: {
                  tenantId: matchedDevice.tenantId,
                  phoneNumber: senderPhone,
                  deletedAt: null,
                },
              });

              conversation = await prisma.conversation.create({
                data: {
                  tenantId: matchedDevice.tenantId,
                  deviceId: matchedDevice.id,
                  contactId: contact?.id || null,
                  remoteJid: targetJid,
                  status: 'OPEN',
                  lastMessageAt: new Date(Number(msg.timestamp) * 1000 || Date.now()),
                  unreadCount: 1,
                },
              });
            } else {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  lastMessageAt: new Date(Number(msg.timestamp) * 1000 || Date.now()),
                  unreadCount: { increment: 1 },
                },
              });
            }

            // Save inbound message
            const saved = await prisma.message.create({
              data: {
                tenantId: matchedDevice.tenantId,
                deviceId: matchedDevice.id,
                conversationId: conversation.id,
                direction: MessageDirection.INBOUND,
                remoteJid: targetJid,
                messageType,
                content,
                mediaUrl,
                status: MessageStatus.DELIVERED,
                externalMessageId: msg.id,
                metadata: msg,
                deliveredAt: new Date(Number(msg.timestamp) * 1000 || Date.now()),
              },
            });

            // Publish to Redis for Socket.IO
            await request.server.redis.publish(
              `tenant:${matchedDevice.tenantId}:inbox`,
              JSON.stringify({
                event: 'message:received',
                conversationId: conversation.id,
                message: saved,
              })
            );
          }
        }

        // 3. Handle Delivery Status Receipts (sent, delivered, read, failed)
        if (val.statuses && val.statuses.length > 0) {
          for (const statusObj of val.statuses) {
            const externalId = statusObj.id;
            const metaStatus = statusObj.status?.toUpperCase(); // SENT, DELIVERED, READ, FAILED
            const timestamp = new Date(Number(statusObj.timestamp) * 1000 || Date.now());

            let appStatus: MessageStatusValue = MessageStatus.SENT;
            if (metaStatus === 'DELIVERED') appStatus = MessageStatus.DELIVERED;
            if (metaStatus === 'READ') appStatus = MessageStatus.READ;
            if (metaStatus === 'FAILED') appStatus = MessageStatus.FAILED;

            let errorCode: string | undefined;
            let errorMessage: string | undefined;

            if (statusObj.errors && statusObj.errors.length > 0) {
              const err = statusObj.errors[0];
              errorCode = String(err.code);
              errorMessage = err.title || err.message;
            }

            await prisma.message.updateMany({
              where: { externalMessageId: externalId },
              data: {
                status: appStatus,
                errorCode,
                errorMessage,
                ...(appStatus === MessageStatus.DELIVERED ? { deliveredAt: timestamp } : {}),
                ...(appStatus === MessageStatus.READ ? { readAt: timestamp } : {}),
              },
            });

            await request.server.redis.publish(
              `tenant:${matchedDevice.tenantId}:inbox`,
              JSON.stringify({
                event: 'message:status',
                externalMessageId: externalId,
                status: appStatus,
                errorCode,
                errorMessage,
              })
            );
          }
        }
      }
    }

    return reply.status(200).send({ success: true, processed: true });
  }
}
