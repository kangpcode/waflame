import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { JwtUserPayload } from './jwt.plugin.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

const socketPlugin: FastifyPluginAsync = async (fastify) => {
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: (origin, cb) => cb(null, true),
      credentials: true,
    },
    path: '/socket.io/',
  });

  // JWT Authentication for Socket Handshake
  io.use(async (socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = fastify.jwt.verify<JwtUserPayload>(token);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Redis Subscriber to relay events from wa-engine / worker to clients
  const redisSub = new Redis(env.REDIS_URL);

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtUserPayload;
    fastify.log.info(`[Socket.IO] Client connected: ${user.email} (Tenant: ${user.tenantId})`);

    // Join tenant room
    socket.join(`tenant:${user.tenantId}`);

    // Allow client to subscribe to specific device rooms
    socket.on('join:device', async (deviceId: string) => {
      // Validate device belongs to tenant
      const device = await fastify.prisma.device.findFirst({
        where: { id: deviceId, tenantId: user.isSuperadmin ? undefined : user.tenantId },
      });

      if (device) {
        socket.join(`device:${deviceId}`);
        fastify.log.info(`[Socket.IO] Client ${user.email} joined device room: device:${deviceId}`);
        await redisSub.subscribe(`device:${deviceId}`);
      }
    });

    socket.on('leave:device', (deviceId: string) => {
      socket.leave(`device:${deviceId}`);
    });

    socket.on('disconnect', () => {
      fastify.log.info(`[Socket.IO] Client disconnected: ${user.email}`);
    });
  });

  // Relay Redis messages to Socket.IO rooms
  redisSub.on('message', (channel, message) => {
    try {
      const parsed = JSON.parse(message);
      // channel can be device:UUID or tenant:UUID:inbox
      io.to(channel).emit(parsed.event, parsed);
    } catch (err) {
      fastify.log.error(err, 'Failed to relay Redis message to Socket.IO');
    }
  });

  fastify.decorate('io', io);

  fastify.addHook('onClose', async () => {
    await redisSub.quit();
    await io.close();
  });
};

export default fp(socketPlugin, {
  name: 'socket-plugin',
});
