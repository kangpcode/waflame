import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z.string().min(2, 'Nama API Key minimal 2 karakter').max(100),
  permissions: z.array(z.string()).min(1, 'Minimal satu permission diperlukan'),
  rateLimitPerMinute: z.number().int().min(10).max(600).default(60),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const UpdateApiKeySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  permissions: z.array(z.string()).min(1).optional(),
  rateLimitPerMinute: z.number().int().min(10).max(600).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;
