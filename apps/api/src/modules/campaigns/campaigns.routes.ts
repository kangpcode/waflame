import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { CampaignsController } from './campaigns.controller.js';

export async function campaignsRoutes(fastify: FastifyInstance) {
  const controller = new CampaignsController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.CAMPAIGN_READ)] },
    controller.list.bind(controller)
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.CAMPAIGN_READ)] },
    controller.get.bind(controller)
  );

  fastify.get(
    '/:id/recipients',
    { preHandler: [requirePermission(Permission.CAMPAIGN_READ)] },
    controller.recipients.bind(controller)
  );

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.CAMPAIGN_CREATE)] },
    controller.create.bind(controller)
  );

  fastify.post(
    '/:id/action',
    { preHandler: [requirePermission(Permission.CAMPAIGN_CREATE)] },
    controller.action.bind(controller)
  );
}
