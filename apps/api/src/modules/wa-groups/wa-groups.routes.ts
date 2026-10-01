import { FastifyPluginAsync } from 'fastify';
import { WaGroupsController } from './wa-groups.controller.js';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { Permission } from '@waflame/shared';

export const waGroupsRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new WaGroupsController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.GROUP_READ)] },
    controller.list
  );

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.GROUP_CREATE)] },
    controller.create
  );

  fastify.get(
    '/:groupJid',
    { preHandler: [requirePermission(Permission.GROUP_READ)] },
    controller.getMetadata
  );

  fastify.post(
    '/:groupJid/invite',
    { preHandler: [requirePermission(Permission.GROUP_MANAGE)] },
    controller.invite
  );

  fastify.post(
    '/:groupJid/kick',
    { preHandler: [requirePermission(Permission.GROUP_MANAGE)] },
    controller.kick
  );

  fastify.post(
    '/:groupJid/promote',
    { preHandler: [requirePermission(Permission.GROUP_MANAGE)] },
    controller.promote
  );

  fastify.post(
    '/:groupJid/demote',
    { preHandler: [requirePermission(Permission.GROUP_MANAGE)] },
    controller.demote
  );

  fastify.get(
    '/:groupJid/invite-link',
    { preHandler: [requirePermission(Permission.GROUP_READ)] },
    controller.getInviteLink
  );

  fastify.post(
    '/:groupJid/revoke-link',
    { preHandler: [requirePermission(Permission.GROUP_MANAGE)] },
    controller.revokeInviteLink
  );

  fastify.post(
    '/:groupJid/leave',
    { preHandler: [requirePermission(Permission.GROUP_MANAGE)] },
    controller.leave
  );
};
