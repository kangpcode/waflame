import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    fastify.log.info('✅ Redis connected successfully');
  } catch (err) {
    fastify.log.warn(`⚠️ Redis connection failed: ${(err as Error).message}`);
  }

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async (server) => {
    server.log.info('Closing Redis connection...');
    await server.redis.quit();
  });
};

export default fp(redisPlugin, {
  name: 'redis-plugin',
});
