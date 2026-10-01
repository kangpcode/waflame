import { FastifyPluginAsync } from 'fastify';
import { MetaWebhookController } from './meta-webhook.controller.js';

export const metaWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new MetaWebhookController();

  // GET: Webhook verification challenge from Meta
  fastify.get('/meta', controller.verifyChallenge);

  // POST: Inbound notifications from Meta
  fastify.post('/meta', controller.handleWebhook);
};
