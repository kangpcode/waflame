import crypto from 'node:crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@waflame/database';

export async function authenticateApiKey(request: FastifyRequest, reply: FastifyReply) {
  let rawKey = request.headers['x-api-key'] as string | undefined;

  if (!rawKey) {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer wf_live_')) {
      rawKey = authHeader.substring(7);
    }
  }

  if (!rawKey) {
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      error: 'Unauthorized',
      message: 'API Key diperlukan pada header "X-API-Key" atau "Authorization: Bearer <key>"',
    });
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
    },
  });

  if (!apiKey) {
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      error: 'Unauthorized',
      message: 'API Key tidak valid atau telah dinonaktifkan',
    });
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return reply.status(401).send({
      success: false,
      statusCode: 401,
      error: 'Unauthorized',
      message: 'API Key telah kedaluwarsa',
    });
  }

  // Rate Limiting per minute
  const minuteBucket = Math.floor(Date.now() / 60000);
  const rateLimitKey = `ratelimit:apikey:${apiKey.id}:${minuteBucket}`;
  const currentCount = await request.server.redis.incr(rateLimitKey);

  if (currentCount === 1) {
    await request.server.redis.expire(rateLimitKey, 70);
  }

  reply.header('X-RateLimit-Limit', apiKey.rateLimitPerMinute);
  reply.header('X-RateLimit-Remaining', Math.max(0, apiKey.rateLimitPerMinute - currentCount));

  if (currentCount > apiKey.rateLimitPerMinute) {
    reply.header('Retry-After', '60');
    return reply.status(429).send({
      success: false,
      statusCode: 429,
      error: 'TooManyRequests',
      message: `Batas rate limit API Key terlampaui (${apiKey.rateLimitPerMinute} request/menit).`,
    });
  }

  // Touch lastUsedAt asynchronously
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => request.log.warn(`Failed to update lastUsedAt for apiKey ${apiKey.id}: ${err.message}`));

  (request as any).tenantId = apiKey.tenantId;
  (request as any).apiKey = apiKey;
}
