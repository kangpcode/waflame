import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { ApiKeysController } from './api-keys.controller.js';

export async function apiKeysRoutes(fastify: FastifyInstance) {
  const controller = new ApiKeysController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.APIKEY_MANAGE)] },
    controller.list.bind(controller)
  );

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.APIKEY_MANAGE)] },
    controller.create.bind(controller)
  );

  fastify.put(
    '/:id',
    { preHandler: [requirePermission(Permission.APIKEY_MANAGE)] },
    controller.update.bind(controller)
  );

  fastify.delete(
    '/:id',
    { preHandler: [requirePermission(Permission.APIKEY_MANAGE)] },
    controller.delete.bind(controller)
  );
}
