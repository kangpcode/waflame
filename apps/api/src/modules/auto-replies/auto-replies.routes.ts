import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { AutoRepliesController } from './auto-replies.controller.js';

export async function autoRepliesRoutes(fastify: FastifyInstance) {
  const controller = new AutoRepliesController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.BOT_READ)] },
    controller.list.bind(controller)
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.BOT_READ)] },
    controller.get.bind(controller)
  );

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.BOT_MANAGE)] },
    controller.create.bind(controller)
  );

  fastify.put(
    '/:id',
    { preHandler: [requirePermission(Permission.BOT_MANAGE)] },
    controller.update.bind(controller)
  );

  fastify.delete(
    '/:id',
    { preHandler: [requirePermission(Permission.BOT_MANAGE)] },
    controller.delete.bind(controller)
  );
}
