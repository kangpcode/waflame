import { prisma } from '@waflame/database';
import {
  ConversationFilterQuery,
  ConversationStatus,
  ConversationStatusValue,
  InboxReplyInput,
  MessageDirection,
  MessageStatus,
  MessageType,
  decryptAES256,
  toWhatsAppJid,
} from '@waflame/shared';
import { OfficialCloudProvider, sessionManager, WhatsAppProvider } from '@waflame/wa-core';
import { env } from '../../config/env.js';

export class InboxService {
  /**
   * Helper to get active WhatsAppProvider
   */
  private getProvider(device: any): WhatsAppProvider {
    if (device.providerType === 'OFFICIAL') {
      if (!device.wabaId || !device.phoneNumberId || !device.accessToken) {
        throw new Error('Kredensial Meta Cloud API pada perangkat tidak lengkap');
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
    } else {
      const session = sessionManager.getSession(device.id);
      if (!session || session.status !== 'CONNECTED') {
        throw new Error(`Sesi perangkat ${device.name} sedang tidak terhubung (${device.status})`);
      }
      return session;
    }
  }

  /**
   * List conversations
   */
  async listConversations(tenantId: string, query: ConversationFilterQuery) {
    const { status, assignedAgentId, deviceId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(status ? { status } : {}),
      ...(assignedAgentId ? { assignedAgentId } : {}),
      ...(deviceId ? { deviceId } : {}),
      ...(search
        ? {
            OR: [
              { remoteJid: { contains: search } },
              { contact: { firstName: { contains: search } } },
              { contact: { lastName: { contains: search } } },
              { contact: { phoneNumber: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          device: { select: { id: true, name: true, providerType: true, status: true } },
          contact: { select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true } },
          assignedAgent: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, direction: true, messageType: true, content: true, status: true, createdAt: true },
          },
        },
      }),
    ]);

    return {
      conversations: conversations.map((c) => ({
        ...c,
        lastMessage: c.messages[0] || null,
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
   * Get single conversation with full message thread
   */
  async getConversation(tenantId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        device: { select: { id: true, name: true, providerType: true, status: true } },
        contact: {
          include: {
            groupMembers: { include: { group: true } },
            tagRelations: { include: { tag: true } },
          },
        },
        assignedAgent: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!conversation) throw new Error('Percakapan tidak ditemukan');

    // Automatically mark unread count as 0 when viewed
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      });
    }

    return conversation;
  }

  /**
   * Assign conversation to an agent (or unassign)
   */
  async assignAgent(tenantId: string, conversationId: string, agentId: string | null) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) throw new Error('Percakapan tidak ditemukan');

    if (agentId) {
      const agent = await prisma.user.findFirst({
        where: {
          id: agentId,
          tenantUsers: { some: { tenantId } },
        },
      });
      if (!agent) throw new Error('Agen tidak ditemukan dalam tim');
    }

    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedAgentId: agentId },
      include: {
        assignedAgent: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /**
   * Update conversation status: OPEN, PENDING, RESOLVED
   */
  async updateStatus(tenantId: string, conversationId: string, status: ConversationStatusValue) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) throw new Error('Percakapan tidak ditemukan');

    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });
  }

  /**
   * Reply directly to conversation
   */
  async replyMessage(tenantId: string, userId: string, conversationId: string, input: InboxReplyInput) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { device: true },
    });
    if (!conversation) throw new Error('Percakapan tidak ditemukan');

    const provider = this.getProvider(conversation.device);

    // 1. Send via provider
    const sendResult = await provider.sendMessage({
      to: conversation.remoteJid,
      type: input.mediaUrl ? input.mediaType : MessageType.TEXT,
      content: input.content,
      mediaUrl: input.mediaUrl || undefined,
      caption: input.content,
    });

    // 2. Store outbound message
    const message = await prisma.message.create({
      data: {
        tenantId,
        deviceId: conversation.deviceId,
        conversationId,
        direction: MessageDirection.OUTBOUND,
        remoteJid: conversation.remoteJid,
        messageType: input.mediaUrl ? input.mediaType : MessageType.TEXT,
        content: input.content,
        mediaUrl: input.mediaUrl || null,
        mediaType: input.mediaType,
        status: MessageStatus.SENT,
        externalMessageId: sendResult?.id || null,
        metadata: { repliedByUserId: userId },
        sentAt: new Date(),
      },
    });

    // 3. Update conversation last message & reset unread
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: 0,
        status: ConversationStatus.OPEN,
      },
    });

    return message;
  }

  /**
   * Create internal private note in conversation thread
   */
  async createInternalNote(tenantId: string, userId: string, conversationId: string, content: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) throw new Error('Percakapan tidak ditemukan');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    });

    return await prisma.message.create({
      data: {
        tenantId,
        deviceId: conversation.deviceId,
        conversationId,
        direction: MessageDirection.OUTBOUND,
        remoteJid: conversation.remoteJid,
        messageType: MessageType.INTERNAL_NOTE,
        content,
        status: MessageStatus.READ,
        metadata: {
          isInternalNote: true,
          author: user,
        },
      },
    });
  }
}
