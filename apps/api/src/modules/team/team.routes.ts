import { FastifyPluginAsync } from 'fastify';
import { TeamController } from './team.controller.js';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { Permission } from '@waflame/shared';

export const teamRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new TeamController();

  // All team endpoints require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/members', { preHandler: [requirePermission(Permission.TEAM_READ)] }, controller.getMembers);
  fastify.get('/roles', { preHandler: [requirePermission(Permission.TEAM_READ)] }, controller.getRoles);
};
