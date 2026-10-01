import { FastifyInstance } from 'fastify';
import { authenticateApiKey } from '../../middleware/apikey.guard.js';
import { PublicApiController } from './public-api.controller.js';

export async function publicApiRoutes(fastify: FastifyInstance) {
  const controller = new PublicApiController();

  // All public API routes require API Key authentication & rate limiting
  fastify.addHook('preHandler', authenticateApiKey);

  fastify.post('/messages/send', controller.sendMessage.bind(controller));
  fastify.get('/devices', controller.listDevices.bind(controller));
  fastify.get('/contacts', controller.listContacts.bind(controller));
  fastify.post('/contacts', controller.createContact.bind(controller));
}
