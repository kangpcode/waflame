import { z } from 'zod';
import {
  AutoReplyResponseType,
  AutoReplyTriggerType,
} from '../constants/inbox.js';

export const BusinessHourSlotSchema = z.object({
  day: z.number().int().min(0).max(6), // 0: Sunday, 1: Monday, ...
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam HH:mm'),
  enabled: z.boolean().default(true),
});

export const CreateAutoReplySchema = z.object({
  deviceId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'Nama auto reply minimal 2 karakter').max(100),
  triggerType: z.enum([
    AutoReplyTriggerType.EXACT,
    AutoReplyTriggerType.CONTAINS,
    AutoReplyTriggerType.REGEX,
    AutoReplyTriggerType.WELCOME,
    AutoReplyTriggerType.FALLBACK,
  ]),
  keywords: z.array(z.string()).optional().default([]),
  responseType: z.enum([
    AutoReplyResponseType.TEXT,
    AutoReplyResponseType.MEDIA,
    AutoReplyResponseType.TEMPLATE,
  ]).default(AutoReplyResponseType.TEXT),
  responseContent: z.string().min(1, 'Isi pesan balasan wajib diisi'),
  mediaUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  scheduleEnabled: z.boolean().default(false),
  businessHours: z.array(BusinessHourSlotSchema).optional().nullable(),
});

export type CreateAutoReplyInput = z.infer<typeof CreateAutoReplySchema>;

export const UpdateAutoReplySchema = CreateAutoReplySchema.partial();
export type UpdateAutoReplyInput = z.infer<typeof UpdateAutoReplySchema>;
