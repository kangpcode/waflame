import { FastifyInstance } from 'fastify';
import { Permission } from '@waflame/shared';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { AuditLogsController } from './audit-logs.controller.js';

export async function auditLogsRoutes(fastify: FastifyInstance) {
  const controller = new AuditLogsController();

  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.TEAM_READ)] },
    controller.list.bind(controller)
  );
}
