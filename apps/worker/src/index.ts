import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

console.log('⚡ Waflame BullMQ Worker initialized (Fase 2 foundation ready)');
