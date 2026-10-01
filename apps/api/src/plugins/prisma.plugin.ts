import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { prisma, PrismaClient } from '@waflame/database';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (server) => {
    server.log.info('Closing Prisma database connection...');
    await server.prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: 'prisma-plugin',
});
