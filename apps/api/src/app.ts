import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { env } from './config/env.js';

// Plugins
import prismaPlugin from './plugins/prisma.plugin.js';
import redisPlugin from './plugins/redis.plugin.js';
import jwtPlugin from './plugins/jwt.plugin.js';
import swaggerPlugin from './plugins/swagger.plugin.js';
import socketPlugin from './plugins/socket.plugin.js';

// Routes
import { authRoutes } from './modules/auth/auth.routes.js';
import { teamRoutes } from './modules/team/team.routes.js';
import { devicesRoutes } from './modules/devices/devices.routes.js';
import { messagesRoutes } from './modules/messages/messages.routes.js';
import { waGroupsRoutes } from './modules/wa-groups/wa-groups.routes.js';
import { templatesRoutes } from './modules/templates/templates.routes.js';
import { metaWebhookRoutes } from './modules/webhooks/meta-webhook.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            },
          }
        : true,
  });

  // Security Plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Swagger UI compatibility
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman)
      if (!origin) return cb(null, true);
      // In development allow localhost origins
      if (env.NODE_ENV === 'development' || origin === env.CORS_ORIGIN) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  await app.register(cookie);

  // Core Infrastructure Plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);
  await app.register(swaggerPlugin);
  await app.register(socketPlugin);

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'waflame-api',
      version: '1.0.0',
    };
  });

  // Register V1 API Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(teamRoutes, { prefix: '/api/v1/team' });
  await app.register(devicesRoutes, { prefix: '/api/v1/devices' });
  await app.register(messagesRoutes, { prefix: '/api/v1/messages' });
  await app.register(waGroupsRoutes, { prefix: '/api/v1/wa-groups' });
  await app.register(templatesRoutes, { prefix: '/api/v1/templates' });
  await app.register(metaWebhookRoutes, { prefix: '/api/v1/webhooks' });

  // Centralized Error Handler
  app.setErrorHandler((error: any, request, reply) => {
    app.log.error(error);

    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      statusCode,
      error: error.name || 'InternalServerError',
      message: error.message || 'Terjadi kesalahan internal pada server',
    });
  });

  return app;
}
