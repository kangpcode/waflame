import { prisma } from '@waflame/database';
import {
  AutoReplyTriggerType,
  CreateAutoReplyInput,
  UpdateAutoReplyInput,
  parseSpintax,
} from '@waflame/shared';

export class AutoRepliesService {
  async list(tenantId: string) {
    return await prisma.autoReply.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        device: { select: { id: true, name: true, providerType: true } },
      },
    });
  }

  async get(tenantId: string, id: string) {
    const item = await prisma.autoReply.findFirst({
      where: { id, tenantId },
      include: {
        device: { select: { id: true, name: true, providerType: true } },
      },
    });
    if (!item) throw new Error('Auto reply rule tidak ditemukan');
    return item;
  }

  async create(tenantId: string, input: CreateAutoReplyInput) {
    return await prisma.autoReply.create({
      data: {
        tenantId,
        deviceId: input.deviceId || null,
        name: input.name,
        triggerType: input.triggerType,
        keywords: input.keywords || [],
        responseType: input.responseType,
        responseContent: input.responseContent,
        mediaUrl: input.mediaUrl || null,
        isActive: input.isActive ?? true,
        scheduleEnabled: input.scheduleEnabled ?? false,
        businessHours: input.businessHours ? (input.businessHours as any) : null,
      },
    });
  }

  async update(tenantId: string, id: string, input: UpdateAutoReplyInput) {
    const item = await prisma.autoReply.findFirst({ where: { id, tenantId } });
    if (!item) throw new Error('Auto reply rule tidak ditemukan');

    return await prisma.autoReply.update({
      where: { id },
      data: {
        ...(input.deviceId !== undefined ? { deviceId: input.deviceId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.triggerType !== undefined ? { triggerType: input.triggerType } : {}),
        ...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
        ...(input.responseType !== undefined ? { responseType: input.responseType } : {}),
        ...(input.responseContent !== undefined ? { responseContent: input.responseContent } : {}),
        ...(input.mediaUrl !== undefined ? { mediaUrl: input.mediaUrl } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.scheduleEnabled !== undefined ? { scheduleEnabled: input.scheduleEnabled } : {}),
        ...(input.businessHours !== undefined ? { businessHours: input.businessHours as any } : {}),
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const item = await prisma.autoReply.findFirst({ where: { id, tenantId } });
    if (!item) throw new Error('Auto reply rule tidak ditemukan');

    await prisma.autoReply.delete({ where: { id } });
    return { message: 'Auto reply rule berhasil dihapus' };
  }

  /**
   * Evaluate incoming message against active rules
   */
  async matchAndGetReply(
    tenantId: string,
    deviceId: string,
    messageText: string,
    isFirstContact: boolean = false
  ): Promise<{ responseType: string; responseContent: string; mediaUrl?: string | null } | null> {
    const rules = await prisma.autoReply.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [{ deviceId }, { deviceId: null }],
      },
    });

    if (rules.length === 0) return null;

    const trimmed = (messageText || '').trim().toLowerCase();
    const now = new Date();
    const currentDay = now.getDay();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMins = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;

    // Filter rules by business hours if schedule is enabled
    const activeRules = rules.filter((rule) => {
      if (!rule.scheduleEnabled || !rule.businessHours) return true;
      const slots = rule.businessHours as Array<{
        day: number;
        startTime: string;
        endTime: string;
        enabled: boolean;
      }>;
      const todaySlot = slots.find((s) => s.day === currentDay && s.enabled);
      if (!todaySlot) return false;
      return currentTimeStr >= todaySlot.startTime && currentTimeStr <= todaySlot.endTime;
    });

    // 1. Exact Match
    for (const rule of activeRules) {
      if (rule.triggerType === AutoReplyTriggerType.EXACT) {
        const keywords = (rule.keywords as string[]) || [];
        if (keywords.some((k) => k.toLowerCase().trim() === trimmed)) {
          return {
            responseType: rule.responseType,
            responseContent: parseSpintax(rule.responseContent),
            mediaUrl: rule.mediaUrl,
          };
        }
      }
    }

    // 2. Contains Match
    for (const rule of activeRules) {
      if (rule.triggerType === AutoReplyTriggerType.CONTAINS) {
        const keywords = (rule.keywords as string[]) || [];
        if (keywords.some((k) => trimmed.includes(k.toLowerCase().trim()))) {
          return {
            responseType: rule.responseType,
            responseContent: parseSpintax(rule.responseContent),
            mediaUrl: rule.mediaUrl,
          };
        }
      }
    }

    // 3. Regex Match
    for (const rule of activeRules) {
      if (rule.triggerType === AutoReplyTriggerType.REGEX) {
        const keywords = (rule.keywords as string[]) || [];
        for (const pattern of keywords) {
          try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(messageText)) {
              return {
                responseType: rule.responseType,
                responseContent: parseSpintax(rule.responseContent),
                mediaUrl: rule.mediaUrl,
              };
            }
          } catch {
            // ignore invalid regex
          }
        }
      }
    }

    // 4. Welcome Message (if new contact)
    if (isFirstContact) {
      const welcomeRule = activeRules.find(
        (r) => r.triggerType === AutoReplyTriggerType.WELCOME
      );
      if (welcomeRule) {
        return {
          responseType: welcomeRule.responseType,
          responseContent: parseSpintax(welcomeRule.responseContent),
          mediaUrl: welcomeRule.mediaUrl,
        };
      }
    }

    // 5. Fallback Message
    const fallbackRule = activeRules.find(
      (r) => r.triggerType === AutoReplyTriggerType.FALLBACK
    );
    if (fallbackRule) {
      return {
        responseType: fallbackRule.responseType,
        responseContent: parseSpintax(fallbackRule.responseContent),
        mediaUrl: fallbackRule.mediaUrl,
      };
    }

    return null;
  }
}
