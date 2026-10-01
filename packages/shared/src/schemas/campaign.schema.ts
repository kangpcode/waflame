import { z } from 'zod';
import { MessageType } from '../constants/messages.js';

export const CreateCampaignSchema = z.object({
  deviceId: z.string().uuid('Perangkat wajib dipilih'),
  name: z.string().min(2, 'Nama kampanye minimal 2 karakter').max(150),
  description: z.string().max(255).optional(),
  messageType: z.enum([
    MessageType.TEXT,
    MessageType.IMAGE,
    MessageType.VIDEO,
    MessageType.DOCUMENT,
    MessageType.TEMPLATE,
  ]),
  rawMessage: z.string().optional(),
  mediaUrl: z.string().url('URL media tidak valid').optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
  templateParams: z.array(z.string()).optional(),
  
  // Recipient targeting
  contactIds: z.array(z.string().uuid()).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  customRecipients: z
    .array(
      z.object({
        phoneNumber: z.string().min(5),
        name: z.string().optional(),
        customFields: z.record(z.any()).optional(),
      })
    )
    .optional(),

  // Anti-banned throttling
  minDelaySec: z.number().int().min(2).default(5),
  maxDelaySec: z.number().int().min(3).default(15),

  // Scheduling
  scheduledAt: z.string().datetime().optional().nullable(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const CampaignActionSchema = z.object({
  action: z.enum(['START', 'PAUSE', 'RESUME', 'CANCEL']),
});

export type CampaignActionInput = z.infer<typeof CampaignActionSchema>;
