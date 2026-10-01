import { FastifyPluginAsync } from 'fastify';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.guard.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AuthController();

  // Public Routes
  fastify.post('/register', controller.register);
  fastify.post('/login', controller.login);
  fastify.post('/refresh', controller.refresh);
  fastify.post('/logout', controller.logout);

  // Protected Routes (memerlukan JWT access token)
  fastify.get('/me', { preHandler: [authenticate] }, controller.me);
  fastify.put('/me', { preHandler: [authenticate] }, controller.updateProfile);
  fastify.put('/password', { preHandler: [authenticate] }, controller.changePassword);
};
