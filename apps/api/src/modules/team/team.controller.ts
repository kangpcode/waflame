import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@waflame/database';

export class TeamController {
  /**
   * GET /api/v1/team/members - List members in current tenant
   */
  async getMembers(request: FastifyRequest, reply: FastifyReply) {
    const tenantId = request.user.tenantId;

    const members = await prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            lastLoginAt: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.status(200).send({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        user: m.user,
        role: m.role,
        isOwner: m.isOwner,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
    });
  }

  /**
   * GET /api/v1/team/roles - List roles available in this tenant or system
   */
  async getRoles(request: FastifyRequest, reply: FastifyReply) {
    const tenantId = request.user.tenantId;

    const roles = await prisma.role.findMany({
      where: {
        OR: [{ tenantId: null }, { tenantId }],
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return reply.status(200).send({
      success: true,
      data: roles.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        isSystem: r.isSystem,
        permissions: r.rolePermissions.map((rp) => rp.permission.slug),
      })),
    });
  }
}
