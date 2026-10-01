import { FastifyPluginAsync } from 'fastify';
import { DevicesController } from './devices.controller.js';
import { authenticate } from '../../middleware/auth.guard.js';
import { requirePermission } from '../../middleware/rbac.guard.js';
import { Permission } from '@waflame/shared';

export const devicesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new DevicesController();

  // All device routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.post(
    '/',
    { preHandler: [requirePermission(Permission.DEVICE_CREATE)] },
    controller.create
  );

  fastify.get(
    '/',
    { preHandler: [requirePermission(Permission.DEVICE_READ)] },
    controller.list
  );

  fastify.get(
    '/:id',
    { preHandler: [requirePermission(Permission.DEVICE_READ)] },
    controller.get
  );

  fastify.put(
    '/:id',
    { preHandler: [requirePermission(Permission.DEVICE_UPDATE)] },
    controller.update
  );

  fastify.delete(
    '/:id',
    { preHandler: [requirePermission(Permission.DEVICE_DELETE)] },
    controller.delete
  );

  fastify.get(
    '/:id/qr',
    { preHandler: [requirePermission(Permission.DEVICE_MANAGE)] },
    controller.getQR
  );

  fastify.post(
    '/:id/reconnect',
    { preHandler: [requirePermission(Permission.DEVICE_MANAGE)] },
    controller.reconnect
  );

  fastify.post(
    '/:id/logout',
    { preHandler: [requirePermission(Permission.DEVICE_MANAGE)] },
    controller.logout
  );
};
