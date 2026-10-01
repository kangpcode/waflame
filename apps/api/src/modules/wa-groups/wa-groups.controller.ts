import { FastifyReply, FastifyRequest } from 'fastify';
import { WaGroupsService } from './wa-groups.service.js';

const waGroupsService = new WaGroupsService();

export class WaGroupsController {
  /**
   * GET /api/v1/wa-groups?deviceId=...
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { deviceId } = (request.query as any) || {};
    if (!deviceId) {
      return reply.status(400).send({
        success: false,
        message: 'Parameter query deviceId wajib disertakan',
      });
    }

    try {
      const groups = await waGroupsService.getGroups(request.user.tenantId, deviceId);
      return reply.status(200).send({
        success: true,
        data: groups,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/wa-groups
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { deviceId, name, participants } = (request.body as any) || {};
    if (!deviceId || !name || !participants) {
      return reply.status(400).send({
        success: false,
        message: 'deviceId, name, dan participants wajib diisi',
      });
    }

    try {
      const group = await waGroupsService.createGroup(
        request.user.tenantId,
        deviceId,
        name,
        participants
      );
      return reply.status(201).send({
        success: true,
        message: 'Grup WhatsApp berhasil dibuat',
        data: group,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * GET /api/v1/wa-groups/:groupJid?deviceId=...
   */
  async getMetadata(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId } = (request.query as any) || {};

    try {
      const meta = await waGroupsService.getGroupMetadata(
        request.user.tenantId,
        deviceId,
        groupJid
      );
      return reply.status(200).send({
        success: true,
        data: meta,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/wa-groups/:groupJid/invite
   */
  async invite(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId, participants } = (request.body as any) || {};

    try {
      const result = await waGroupsService.inviteParticipants(
        request.user.tenantId,
        deviceId,
        groupJid,
        participants
      );
      return reply.status(200).send({
        success: true,
        message: 'Peserta berhasil diundang ke grup',
        data: result,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/wa-groups/:groupJid/kick
   */
  async kick(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId, participantJid } = (request.body as any) || {};

    try {
      await waGroupsService.removeParticipant(
        request.user.tenantId,
        deviceId,
        groupJid,
        participantJid
      );
      return reply.status(200).send({
        success: true,
        message: 'Peserta berhasil dikeluarkan dari grup',
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/wa-groups/:groupJid/promote
   */
  async promote(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId, participantJid } = (request.body as any) || {};

    try {
      await waGroupsService.promoteAdmin(
        request.user.tenantId,
        deviceId,
        groupJid,
        participantJid
      );
      return reply.status(200).send({
        success: true,
        message: 'Peserta berhasil diangkat menjadi admin',
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/wa-groups/:groupJid/demote
   */
  async demote(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId, participantJid } = (request.body as any) || {};

    try {
      await waGroupsService.demoteAdmin(
        request.user.tenantId,
        deviceId,
        groupJid,
        participantJid
      );
      return reply.status(200).send({
        success: true,
        message: 'Status admin peserta berhasil dicabut',
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * GET /api/v1/wa-groups/:groupJid/invite-link?deviceId=...
   */
  async getInviteLink(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId } = (request.query as any) || {};

    try {
      const link = await waGroupsService.getInviteLink(
        request.user.tenantId,
        deviceId,
        groupJid
      );
      return reply.status(200).send({
        success: true,
        data: { inviteLink: link },
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/wa-groups/:groupJid/revoke-link
   */
  async revokeInviteLink(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId } = (request.body as any) || {};

    try {
      const newLink = await waGroupsService.revokeInviteLink(
        request.user.tenantId,
        deviceId,
        groupJid
      );
      return reply.status(200).send({
        success: true,
        message: 'Link undangan berhasil direset',
        data: { inviteLink: newLink },
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/wa-groups/:groupJid/leave
   */
  async leave(request: FastifyRequest, reply: FastifyReply) {
    const { groupJid } = (request.params as any) || {};
    const { deviceId } = (request.body as any) || {};

    try {
      await waGroupsService.leaveGroup(
        request.user.tenantId,
        deviceId,
        groupJid
      );
      return reply.status(200).send({
        success: true,
        message: 'Berhasil keluar dari grup',
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
