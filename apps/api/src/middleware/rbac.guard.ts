import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Middleware factory to enforce a required permission.
 * Super Admins automatically bypass permission checks.
 */
export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Pengguna belum terotentikasi',
      });
    }

    // Superadmin bypass
    if (user.isSuperadmin) {
      return;
    }

    if (!user.permissions || !user.permissions.includes(permission)) {
      return reply.status(403).send({
        success: false,
        statusCode: 403,
        error: 'Forbidden',
        message: `Anda tidak memiliki hak akses [${permission}] untuk melakukan aksi ini`,
      });
    }
  };
}

/**
 * Middleware factory to enforce a required system role.
 */
export function requireRole(role: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Pengguna belum terotentikasi',
      });
    }

    if (user.isSuperadmin) {
      return;
    }

    if (user.role !== role) {
      return reply.status(403).send({
        success: false,
        statusCode: 403,
        error: 'Forbidden',
        message: `Role [${role}] diperlukan untuk mengakses resource ini`,
      });
    }
  };
}
