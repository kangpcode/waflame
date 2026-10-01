import crypto from 'node:crypto';
import { Job, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '@waflame/database';
import { QueueName, WebhookOutboundJobData } from '@waflame/shared';
import { env } from '../config/env.js';

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export function createWebhookOutboundWorker() {
  const worker = new Worker<WebhookOutboundJobData>(
    QueueName.WEBHOOK_OUTBOUND,
    async (job: Job<WebhookOutboundJobData>) => {
      const { tenantId, webhookId, url, secretKey, event, payload } = job.data;
      console.log(`[Worker:Webhook] Dispatching event "${event}" to ${url} (job ${job.id})`);

      const payloadString = JSON.stringify(payload);
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secretKey).update(payloadString).digest('hex');

      const startTime = Date.now();
      let responseStatus: number | null = null;
      let responseBody: string | null = null;
      let status: 'SUCCESS' | 'FAILED' = 'FAILED';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Waflame-Signature-256': signature,
            'X-Waflame-Event': event,
            'X-Waflame-Delivery': String(job.id || ''),
            'X-Waflame-Timestamp': String(Date.now()),
          },
          body: payloadString,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        responseStatus = response.status;
        const text = await response.text();
        responseBody = text.substring(0, 1000); // Store up to 1000 chars

        if (response.ok) {
          status = 'SUCCESS';
        } else {
          status = 'FAILED';
        }
      } catch (err: any) {
        responseBody = `Network Error: ${err.message}`;
        status = 'FAILED';
      }

      const executionTimeMs = Date.now() - startTime;

      // Log delivery result if webhook exists
      const hookExists = await prisma.webhook.findUnique({ where: { id: webhookId } });
      if (hookExists) {
        await prisma.webhookLog.create({
          data: {
            webhookId,
            tenantId,
            event,
            payload,
            responseStatus,
            responseBody,
            executionTimeMs,
            retryCount: job.attemptsMade,
            status,
          },
        });
      }

      if (status === 'FAILED') {
        throw new Error(
          `Webhook delivery failed with HTTP ${responseStatus || 'TIMEOUT'}: ${responseBody}`
        );
      }

      console.log(`[Worker:Webhook] Successfully delivered event "${event}" to ${url}`);
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker:Webhook] Delivery failed for job ${job?.id}:`, err.message);
  });

  return worker;
}
