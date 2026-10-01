import { createCampaignBroadcastWorker } from './processors/campaign-broadcast.processor.js';
import { createCsvImportWorker } from './processors/csv-import.processor.js';
import { createGroupInviteWorker } from './processors/group-invite.processor.js';
import { createMessageSendWorker } from './processors/message-send.processor.js';
import { createWebhookOutboundWorker } from './processors/webhook-outbound.processor.js';
import { BroadcastScheduler } from './scheduler.js';

console.log('====================================================');
console.log('⚡ Waflame BullMQ Worker & Scheduler Starting...');
console.log('====================================================');

const csvImportWorker = createCsvImportWorker();
const groupInviteWorker = createGroupInviteWorker();
const campaignBroadcastWorker = createCampaignBroadcastWorker();
const messageSendWorker = createMessageSendWorker();
const webhookOutboundWorker = createWebhookOutboundWorker();

const scheduler = new BroadcastScheduler();
scheduler.start(15000);

console.log('✅ BullMQ Workers registered:');
console.log('   - CSV & Excel Contact Import Worker');
console.log('   - Group Invite Worker (QR Mode)');
console.log('   - Campaign Broadcast Worker');
console.log('   - Message Send Worker');
console.log('   - Webhook Outbound Dispatcher (HMAC-SHA256)');
console.log('   - Background Scheduled Campaign Dispatcher');
console.log('🚀 Worker service is listening for jobs on Redis...');

async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}, closing BullMQ workers...`);
  scheduler.stop();
  await Promise.all([
    csvImportWorker.close(),
    groupInviteWorker.close(),
    campaignBroadcastWorker.close(),
    messageSendWorker.close(),
    webhookOutboundWorker.close(),
  ]);
  console.log('👋 BullMQ workers stopped gracefully.');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
