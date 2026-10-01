import { z } from 'zod';
import { ProviderType } from '../constants/devices.js';

export const CreateDeviceSchema = z.object({
  name: z.string().min(2, 'Nama perangkat minimal 2 karakter').max(100),
  providerType: z.enum([ProviderType.OFFICIAL, ProviderType.BAILEYS]),
  phoneNumber: z.string().optional(),
  // Khusus Official Mode
  wabaId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  // Anti-banned config
  isWarmupMode: z.boolean().default(false),
  dailyLimit: z.number().int().min(10).max(10000).default(500),
  delayMinMs: z.number().int().min(1000).default(3000),
  delayMaxMs: z.number().int().min(2000).default(8000),
});

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;

export const UpdateDeviceSchema = CreateDeviceSchema.partial();
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
