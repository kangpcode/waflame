import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '@waflame/database';
import { CampaignBroadcastJobData, CampaignStatus, QueueName } from '@waflame/shared';
import { env } from './config/env.js';

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const campaignQueue = new Queue<CampaignBroadcastJobData>(QueueName.CAMPAIGN_BROADCAST, {
  connection: redis,
});

export class BroadcastScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMs: number = 15000) {
    console.log(`[Scheduler] Campaign & Message scheduler started (tick: ${intervalMs}ms)`);
    this.timer = setInterval(() => this.tick(), intervalMs);
    this.tick(); // Run immediately on start
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[Scheduler] Campaign & Message scheduler stopped');
  }

  private async tick() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();

      // Check scheduled campaigns due for dispatch
      const dueCampaigns = await prisma.campaign.findMany({
        where: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
      });

      for (const campaign of dueCampaigns) {
        console.log(`[Scheduler] Triggering scheduled broadcast campaign: ${campaign.name} (${campaign.id})`);

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: CampaignStatus.RUNNING },
        });

        await campaignQueue.add(
          'broadcast',
          {
            tenantId: campaign.tenantId,
            campaignId: campaign.id,
          },
          {
            jobId: `campaign_${campaign.id}_${Date.now()}`,
          }
        );
      }
    } catch (err: any) {
      console.error('[Scheduler] Error in scheduler tick:', err.message);
    } finally {
      this.isRunning = false;
    }
  }
}
