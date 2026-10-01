import { FastifyPluginAsync } from 'fastify';
import { MessagesController } from './messages.controller.js';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { Permission } from '@waflame/shared';

export const messagesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new MessagesController();

  fastify.addHook('preHandler', authenticate);

  fastify.post(
    '/send',
    { preHandler: [requirePermission(Permission.MESSAGE_SEND)] },
    controller.send
  );

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
};
