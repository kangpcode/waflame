import { FastifyPluginAsync } from 'fastify';
import { TemplatesController } from './templates.controller.js';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { Permission } from '@waflame/shared';

export const templatesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new TemplatesController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.MESSAGE_READ)] },
    controller.list
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.MESSAGE_READ)] },
    controller.get
  );

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.MESSAGE_SEND)] },
    controller.create
  );

  fastify.post(
    '/sync',
    { preHandler: [requirePermission(Permission.DEVICE_MANAGE)] },
    controller.sync
  );
};
