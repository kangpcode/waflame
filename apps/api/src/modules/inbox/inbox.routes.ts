import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { InboxController } from './inbox.controller.js';

export async function inboxRoutes(fastify: FastifyInstance) {
  const controller = new InboxController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.INBOX_READ)] },
    controller.list.bind(controller)
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.INBOX_READ)] },
    controller.get.bind(controller)
  );

  fastify.post(
    '/:id/reply',
    { preHandler: [requirePermission(Permission.INBOX_REPLY)] },
    controller.reply.bind(controller)
  );

  fastify.post(
    '/:id/notes',
    { preHandler: [requirePermission(Permission.INBOX_REPLY)] },
    controller.note.bind(controller)
  );

  fastify.post(
    '/:id/assign',
    { preHandler: [requirePermission(Permission.INBOX_MANAGE)] },
    controller.assign.bind(controller)
  );

  fastify.post(
    '/:id/status',
    { preHandler: [requirePermission(Permission.INBOX_MANAGE)] },
    controller.status.bind(controller)
  );
}
