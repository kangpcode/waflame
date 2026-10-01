import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

export interface JwtUserPayload {
  userId: string;
  email: string;
  tenantId: string;
  isSuperadmin: boolean;
  role: string;
  permissions: string[];
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUserPayload;
    user: JwtUserPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    signAccessToken(payload: JwtUserPayload): string;
    signRefreshToken(payload: { userId: string }): string;
    verifyRefreshToken(token: string): { userId: string };
  }
}

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
    sign: {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  });

  fastify.decorate('signAccessToken', (payload: JwtUserPayload) => {
    return fastify.jwt.sign(payload, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
  });

  fastify.decorate('signRefreshToken', (payload: { userId: string }) => {
    return (fastify.jwt.sign as any)(payload, {
      key: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
  });

  fastify.decorate('verifyRefreshToken', (token: string) => {
    return (fastify.jwt.verify as any)(token, {
      key: env.JWT_REFRESH_SECRET,
    }) as { userId: string };
  });
};

export default fp(jwtPlugin, {
  name: 'jwt-plugin',
});
