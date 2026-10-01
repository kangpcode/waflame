import { prisma } from '@waflame/database';
import {
  MessageDirection,
  MessageStatus,
  ProviderType,
  SendMessageInput,
  decryptAES256,
  toWhatsAppJid,
} from '@waflame/shared';
import {
  OfficialCloudProvider,
  WhatsAppProvider,
  sessionManager,
} from '@waflame/wa-core';
import { env } from '../../config/env.js';

export class MessagesService {
  /**
   * Send WhatsApp message immediately via connected device (Official or Baileys)
   */
  async sendMessage(tenantId: string, input: SendMessageInput) {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existingMsg = await prisma.message.findUnique({
        where: {
          tenantId_idempotencyKey: {
            tenantId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });

      if (existingMsg) {
        return {
          id: existingMsg.id,
          status: existingMsg.status,
          externalMessageId: existingMsg.externalMessageId,
          isDuplicate: true,
        };
      }
    }

    // 2. Verify device ownership and status
    const device = await prisma.device.findFirst({
      where: { id: input.deviceId, tenantId, deletedAt: null },
    });

    if (!device) {
      throw new Error('Perangkat tidak ditemukan atau bukan milik organisasi Anda');
    }

    // 3. Resolve Provider (Official Cloud API vs Baileys QR Mode)
    let provider: WhatsAppProvider;

    if (device.providerType === ProviderType.OFFICIAL) {
      if (!device.wabaId || !device.phoneNumberId || !device.accessToken) {
        throw new Error('Kredensial Official Meta Cloud API pada perangkat tidak lengkap');
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
        throw new Error(
          `Perangkat [${device.name}] sedang tidak terhubung (${device.status}). Silakan hubungkan terlebih dahulu.`
        );
      }
      provider = baileysSession;
    }

    const targetJid = input.to.includes('@') ? input.to : toWhatsAppJid(input.to);

    // 4. Send through selected provider
    const sendResult = await provider.sendMessage({
      to: targetJid,
      type: input.type,
      content: input.content,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      caption: input.caption,
      fileName: input.fileName,
      templateName: input.templateName,
      templateLanguage: input.templateLanguage,
      templateComponents: input.templateComponents,
    });

    // 5. Update or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        tenantId,
        deviceId: device.id,
        remoteJid: targetJid,
      },
    });

    if (!conversation) {
      const cleanPhone = input.to.replace(/\D/g, '');
      const contact = await prisma.contact.findFirst({
        where: { tenantId, phoneNumber: cleanPhone, deletedAt: null },
      });

      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          deviceId: device.id,
          contactId: contact?.id || null,
          remoteJid: targetJid,
          status: 'OPEN',
          lastMessageAt: new Date(),
          unreadCount: 0,
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    // 6. Record outbound message to database
    const savedMsg = await prisma.message.create({
      data: {
        tenantId,
        deviceId: device.id,
        conversationId: conversation.id,
        direction: MessageDirection.OUTBOUND,
        remoteJid: targetJid,
        messageType: input.type,
        content: input.content,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        status: MessageStatus.SENT,
        externalMessageId: sendResult.id,
        idempotencyKey: input.idempotencyKey,
        sentAt: new Date(),
      },
    });

    return savedMsg;
  }

  /**
   * List messages with filter & pagination
   */
  async listMessages(
    tenantId: string,
    query: {
      deviceId?: string;
      direction?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(query.deviceId ? { deviceId: query.deviceId } : {}),
      ...(query.direction ? { direction: query.direction } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { content: { contains: query.search } },
              { remoteJid: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [total, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          device: {
            select: { id: true, name: true, phoneNumber: true, providerType: true },
          },
        },
      }),
    ]);

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single message by ID
   */
  async getMessage(tenantId: string, messageId: string) {
    const message = await prisma.message.findFirst({
      where: { id: messageId, tenantId },
      include: {
        device: { select: { id: true, name: true, phoneNumber: true, providerType: true } },
        conversation: true,
      },
    });

    if (!message) throw new Error('Pesan tidak ditemukan');
    return message;
  }
}
