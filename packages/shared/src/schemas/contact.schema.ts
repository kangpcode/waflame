import { z } from 'zod';

export const CreateContactSchema = z.object({
  firstName: z.string().min(1, 'Nama depan wajib diisi').max(100),
  lastName: z.string().max(100).optional(),
  phoneNumber: z.string().min(5, 'Nomor telepon tidak valid').max(30),
  email: z.string().email('Format email tidak valid').optional().nullable(),
  customFields: z.record(z.any()).optional().nullable(),
  groupIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;

export const UpdateContactSchema = CreateContactSchema.partial();
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;

export const BlacklistContactSchema = z.object({
  isBlacklisted: z.boolean(),
  reason: z.string().max(255).optional(),
});

export type BlacklistContactInput = z.infer<typeof BlacklistContactSchema>;

export const ContactGroupSchema = z.object({
  name: z.string().min(1, 'Nama grup kontak wajib diisi').max(100),
  description: z.string().max(255).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Format kode warna HEX tidak valid').default('#f97316'),
});

export type ContactGroupInput = z.infer<typeof ContactGroupSchema>;

export const ContactTagSchema = z.object({
  name: z.string().min(1, 'Nama tag kontak wajib diisi').max(50),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Format kode warna HEX tidak valid').default('#ef4444'),
});

export type ContactTagInput = z.infer<typeof ContactTagSchema>;

export const ContactFilterQuerySchema = z.object({
  search: z.string().optional(),
  groupId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  isBlacklisted: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : 20), z.number().int().min(1).max(100).default(20)),
});

export type ContactFilterQuery = z.infer<typeof ContactFilterQuerySchema>;
