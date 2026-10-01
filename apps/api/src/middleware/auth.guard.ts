import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    // inject active tenantId to request
    request.tenantId = request.user.tenantId;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token otentikasi tidak valid atau telah kedaluwarsa',
    });
  }
}
