import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY harus 64 karakter hex'),
  META_API_VERSION: z.string().default('v21.0'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Konfigurasi Environment Worker tidak valid:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
