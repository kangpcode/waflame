import { FastifyReply, FastifyRequest } from 'fastify';
import { AuditLogsService } from './audit-logs.service.js';

const auditLogsService = new AuditLogsService();

export class AuditLogsController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const result = await auditLogsService.listLogs(
      request.user.tenantId,
      (request.query as any) || {}
    );
    return reply.status(200).send({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  }
}
