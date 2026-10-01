import { z } from 'zod';
import { MessageType } from '../constants/messages.js';

export const SendMessageSchema = z.object({
  deviceId: z.string().uuid('Device ID harus berupa UUID valid'),
  to: z.string().min(5, 'Nomor tujuan minimal 5 digit'),
  type: z.enum([
    MessageType.TEXT,
    MessageType.IMAGE,
    MessageType.VIDEO,
    MessageType.AUDIO,
    MessageType.DOCUMENT,
    MessageType.LOCATION,
    MessageType.CONTACT,
    MessageType.INTERACTIVE,
    MessageType.TEMPLATE,
    MessageType.REACTION,
    MessageType.POLL,
  ]),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.string().optional(),
  caption: z.string().optional(),
  fileName: z.string().optional(),
  templateName: z.string().optional(),
  templateLanguage: z.string().default('id'),
  templateComponents: z.array(z.any()).optional(),
  idempotencyKey: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
