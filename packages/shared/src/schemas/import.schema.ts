import { z } from 'zod';
import { ImportEntityType } from '../constants/campaigns.js';

export const ImportMappingConfigSchema = z.object({
  phoneColumn: z.string().min(1, 'Kolom nomor telepon wajib dipetakan'),
  firstNameColumn: z.string().min(1, 'Kolom nama depan wajib dipetakan'),
  lastNameColumn: z.string().optional(),
  emailColumn: z.string().optional(),
  customFieldColumns: z.array(z.string()).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  overwriteExisting: z.boolean().default(false),
});

export type ImportMappingConfig = z.infer<typeof ImportMappingConfigSchema>;

export const ProcessImportSchema = z.object({
  entityType: z.enum([ImportEntityType.CONTACTS, ImportEntityType.GROUP_INVITES]).default(ImportEntityType.CONTACTS),
  fileName: z.string(),
  filePath: z.string(),
  mappingConfig: ImportMappingConfigSchema,
});

export type ProcessImportInput = z.infer<typeof ProcessImportSchema>;

export const GroupInviteCsvSchema = z.object({
  deviceId: z.string().uuid('Perangkat wajib dipilih'),
  groupJid: z.string().min(5, 'JID grup wajib diisi'),
  fileName: z.string(),
  filePath: z.string(),
  phoneColumn: z.string().min(1, 'Kolom nomor telepon wajib dipetakan'),
  delaySec: z.number().int().min(2).max(60).default(5),
});

export type GroupInviteCsvInput = z.infer<typeof GroupInviteCsvSchema>;
