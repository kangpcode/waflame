import { z } from 'zod';
import { WebhookEvent } from '../constants/inbox.js';

export const CreateWebhookSchema = z.object({
  name: z.string().min(2, 'Nama webhook minimal 2 karakter').max(100),
  url: z.string().url('URL webhook tidak valid (harus diawali http:// atau https://)'),
  secretKey: z
    .string()
    .min(16, 'Secret key minimal 16 karakter untuk keamanan HMAC-SHA256')
    .max(100),
  events: z
    .array(
      z.enum([
        WebhookEvent.MESSAGE_INBOUND,
        WebhookEvent.MESSAGE_STATUS,
        WebhookEvent.DEVICE_STATUS,
      ])
    )
    .min(1, 'Pilih minimal satu event webhook'),
  isActive: z.boolean().default(true),
});

export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;

export const UpdateWebhookSchema = CreateWebhookSchema.partial();
export type UpdateWebhookInput = z.infer<typeof UpdateWebhookSchema>;

export const TestWebhookSchema = z.object({
  url: z.string().url(),
  secretKey: z.string().min(16),
  event: z
    .enum([
      WebhookEvent.MESSAGE_INBOUND,
      WebhookEvent.MESSAGE_STATUS,
      WebhookEvent.DEVICE_STATUS,
    ])
    .default(WebhookEvent.MESSAGE_INBOUND),
});

export type TestWebhookInput = z.infer<typeof TestWebhookSchema>;
