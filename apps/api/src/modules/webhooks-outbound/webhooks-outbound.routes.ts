import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { WebhooksOutboundController } from './webhooks-outbound.controller.js';

export async function webhooksOutboundRoutes(fastify: FastifyInstance) {
  const controller = new WebhooksOutboundController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.WEBHOOK_READ)] },
    controller.list.bind(controller)
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.WEBHOOK_READ)] },
    controller.get.bind(controller)
  );

  fastify.get(
    '/:id/logs',
    { preHandler: [requirePermission(Permission.WEBHOOK_READ)] },
    controller.logs.bind(controller)
  );

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.WEBHOOK_MANAGE)] },
    controller.create.bind(controller)
  );

  fastify.put(
    '/:id',
    { preHandler: [requirePermission(Permission.WEBHOOK_MANAGE)] },
    controller.update.bind(controller)
  );

  fastify.delete(
    '/:id',
    { preHandler: [requirePermission(Permission.WEBHOOK_MANAGE)] },
    controller.delete.bind(controller)
  );

  fastify.post(
    '/test',
    { preHandler: [requirePermission(Permission.WEBHOOK_MANAGE)] },
    controller.test.bind(controller)
  );
}
