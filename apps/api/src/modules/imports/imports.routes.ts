import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { ImportsController } from './imports.controller.js';

export async function importsRoutes(fastify: FastifyInstance) {
  const controller = new ImportsController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.CONTACT_READ)] },
    controller.list.bind(controller)
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.CONTACT_READ)] },
    controller.getStatus.bind(controller)
  );

  fastify.post(
    '/upload',
    { preHandler: [requirePermission(Permission.CONTACT_IMPORT)] },
    controller.uploadAndPreview.bind(controller)
  );

  fastify.post(
    '/contacts',
    { preHandler: [requirePermission(Permission.CONTACT_IMPORT)] },
    controller.processImport.bind(controller)
  );

  fastify.post(
    '/group-invite',
    { preHandler: [requirePermission(Permission.GROUP_MANAGE)] },
    controller.processGroupInvite.bind(controller)
  );
}
