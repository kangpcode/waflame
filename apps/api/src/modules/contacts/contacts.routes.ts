import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { ContactsController } from './contacts.controller.js';

export async function contactsRoutes(fastify: FastifyInstance) {
  const controller = new ContactsController();

  // All contact routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Contacts
  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.CONTACT_READ)] },
    controller.list.bind(controller)
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.CONTACT_READ)] },
    controller.get.bind(controller)
  );

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.CONTACT_CREATE)] },
    controller.create.bind(controller)
  );

  fastify.put(
    '/:id',
    { preHandler: [requirePermission(Permission.CONTACT_UPDATE)] },
    controller.update.bind(controller)
  );

  fastify.delete(
    '/:id',
    { preHandler: [requirePermission(Permission.CONTACT_DELETE)] },
    controller.delete.bind(controller)
  );

  fastify.post(
    '/:id/blacklist',
    { preHandler: [requirePermission(Permission.CONTACT_UPDATE)] },
    controller.setBlacklist.bind(controller)
  );

  // Contact Groups
  fastify.get(
    '/groups',
    { preHandler: [requirePermission(Permission.CONTACT_READ)] },
    controller.listGroups.bind(controller)
  );

  fastify.post(
    '/groups',
    { preHandler: [requirePermission(Permission.CONTACT_MANAGE)] },
    controller.createGroup.bind(controller)
  );

  fastify.put(
    '/groups/:id',
    { preHandler: [requirePermission(Permission.CONTACT_MANAGE)] },
    controller.updateGroup.bind(controller)
  );

  fastify.delete(
    '/groups/:id',
    { preHandler: [requirePermission(Permission.CONTACT_MANAGE)] },
    controller.deleteGroup.bind(controller)
  );

  // Contact Tags
  fastify.get(
    '/tags',
    { preHandler: [requirePermission(Permission.CONTACT_READ)] },
    controller.listTags.bind(controller)
  );

  fastify.post(
    '/tags',
    { preHandler: [requirePermission(Permission.CONTACT_MANAGE)] },
    controller.createTag.bind(controller)
  );

  fastify.delete(
    '/tags/:id',
    { preHandler: [requirePermission(Permission.CONTACT_MANAGE)] },
    controller.deleteTag.bind(controller)
  );
}
