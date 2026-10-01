import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import {
  CampaignBroadcastJobData,
  CsvImportJobData,
  GroupInviteJobData,
  MessageSendJobData,
  QueueName,
  WebhookOutboundJobData,
} from '@waflame/shared';
import { env } from '../config/env.js';

export const queueRedisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const messageSendQueue = new Queue<MessageSendJobData>(QueueName.MESSAGE_SEND, {
  connection: queueRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export const campaignBroadcastQueue = new Queue<CampaignBroadcastJobData>(
  QueueName.CAMPAIGN_BROADCAST,
  {
    connection: queueRedisConnection,
    defaultJobOptions: {
      attempts: 1, // handled internally step-by-step
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  }
);

export const csvImportQueue = new Queue<CsvImportJobData>(QueueName.CSV_IMPORT, {
  connection: queueRedisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 3000,
    },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

export const groupInviteQueue = new Queue<GroupInviteJobData>(QueueName.GROUP_INVITE, {
  connection: queueRedisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

export const webhookOutboundQueue = new Queue<WebhookOutboundJobData>(
  QueueName.WEBHOOK_OUTBOUND,
  {
    connection: queueRedisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 500,
      removeOnFail: 2000,
    },
  }
);
