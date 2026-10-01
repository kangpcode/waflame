import dotenv from 'dotenv';
import path from 'node:path';
import { Redis } from 'ioredis';
import { pino } from 'pino';
import { prisma } from '@waflame/database';
import { MessageDirection, MessageStatus } from '@waflame/shared';
import { sessionManager } from '@waflame/wa-core';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const logger = pino({
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
        }
      : undefined,
});

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const pubRedis = new Redis(redisUrl);
const subRedis = new Redis(redisUrl);

async function main() {
  logger.info('🔥 Starting Waflame Baileys WA-Engine Daemon...');

  // 1. Hook SessionManager events and publish to Redis pub/sub for Socket.IO
  sessionManager.on('device:qr', async (deviceId, qr, qrDataUrl) => {
    logger.info(`[Device ${deviceId}] New QR Code generated`);
    await pubRedis.publish(
      `device:${deviceId}`,
      JSON.stringify({
        event: 'qr:update',
        deviceId,
        qr,
        qrDataUrl,
      })
    );
  });

  sessionManager.on('device:status', async (deviceId, status, reason) => {
    logger.info(`[Device ${deviceId}] Status changed: ${status} (${reason || ''})`);
    await pubRedis.publish(
      `device:${deviceId}`,
      JSON.stringify({
        event: 'status:update',
        deviceId,
        status,
        reason,
      })
    );
  });

  sessionManager.on('device:status', async (deviceId, status) => {
    await prisma.device.updateMany({
      where: { id: deviceId },
      data: { status, lastActiveAt: new Date() },
    });
  });

  sessionManager.on('message:inbound', async (deviceId, msg) => {
    logger.info(`[Device ${deviceId}] Inbound message from ${msg.remoteJid}: ${msg.content}`);

    try {
      // Find device to get tenantId
      const device = await prisma.device.findUnique({ where: { id: deviceId } });
      if (!device) return;

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          tenantId: device.tenantId,
          deviceId: device.id,
          remoteJid: msg.remoteJid,
        },
      });

      if (!conversation) {
        // Link contact if exists
        const cleanPhone = msg.remoteJid.split('@')[0];
        const contact = await prisma.contact.findFirst({
          where: { tenantId: device.tenantId, phoneNumber: cleanPhone },
        });

        conversation = await prisma.conversation.create({
          data: {
            tenantId: device.tenantId,
            deviceId: device.id,
            contactId: contact?.id || null,
            remoteJid: msg.remoteJid,
            status: 'OPEN',
            lastMessageAt: msg.timestamp,
            unreadCount: 1,
          },
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: msg.timestamp,
            unreadCount: { increment: 1 },
          },
        });
      }

      // Save inbound message
      const savedMsg = await prisma.message.create({
        data: {
          tenantId: device.tenantId,
          deviceId: device.id,
          conversationId: conversation.id,
          direction: MessageDirection.INBOUND,
          remoteJid: msg.remoteJid,
          messageType: msg.type,
          content: msg.content,
          mediaUrl: msg.mediaUrl,
          status: MessageStatus.DELIVERED,
          externalMessageId: msg.messageId,
          metadata: msg.raw ? (msg.raw as any) : undefined,
          deliveredAt: msg.timestamp,
        },
      });

      // Broadcast inbound message event to Redis (for live chat inbox)
      await pubRedis.publish(
        `tenant:${device.tenantId}:inbox`,
        JSON.stringify({
          event: 'message:received',
          conversationId: conversation.id,
          message: savedMsg,
        })
      );
    } catch (err) {
      logger.error(err, `Error processing inbound message on device ${deviceId}`);
    }
  });

  sessionManager.on('message:receipt', async (deviceId, receipt) => {
    logger.info(`[Device ${deviceId}] Receipt update for message ${receipt.messageId}: ${receipt.status}`);
    try {
      await prisma.message.updateMany({
        where: { externalMessageId: receipt.messageId },
        data: {
          status: receipt.status,
          ...(receipt.status === 'READ' ? { readAt: receipt.timestamp } : { deliveredAt: receipt.timestamp }),
        },
      });
    } catch (e) {
      // ignore
    }
  });

  // 2. Restore all active sessions from MariaDB
  await sessionManager.restoreSavedSessions();

  // 3. Subscribe to command events from API
  await subRedis.subscribe('waflame:device:command');
  subRedis.on('message', async (channel, message) => {
    if (channel === 'waflame:device:command') {
      try {
        const payload = JSON.parse(message);
        const { action, deviceId } = payload;
        logger.info(`Received device command [${action}] for device ${deviceId}`);

        if (action === 'start' || action === 'reconnect') {
          await sessionManager.getOrCreateSession(deviceId);
        } else if (action === 'stop' || action === 'logout') {
          await sessionManager.removeSession(deviceId);
        }
      } catch (err) {
        logger.error(err, 'Failed to process device command');
      }
    }
  });

  logger.info('✅ Waflame Baileys WA-Engine is running and ready for connections.');
}

main().catch((err) => {
  logger.error(err, 'Fatal error in WA-Engine daemon');
  process.exit(1);
});
