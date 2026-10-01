import { FastifyReply, FastifyRequest } from 'fastify';
import { CampaignActionSchema, CreateCampaignSchema } from '@waflame/shared';
import { CampaignsService } from './campaigns.service.js';

const campaignsService = new CampaignsService();

export class CampaignsController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const campaigns = await campaignsService.listCampaigns(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: campaigns,
    });
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const campaign = await campaignsService.getCampaign(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: campaign,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parse = CreateCampaignSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi pembuatan kampanye gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const campaign = await campaignsService.createCampaign(request.user.tenantId, parse.data);
      return reply.status(201).send({
        success: true,
        message: 'Kampanye berhasil dibuat',
        data: campaign,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async action(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = CampaignActionSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Aksi kampanye tidak valid',
        errors: parse.error.format(),
      });
    }

    try {
      const result = await campaignsService.triggerAction(request.user.tenantId, id, parse.data);
      return reply.status(200).send({
        success: true,
        message: result.message,
        data: { status: result.status },
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  async recipients(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const result = await campaignsService.getRecipients(
        request.user.tenantId,
        id,
        (request.query as any) || {}
      );
      return reply.status(200).send({
        success: true,
        data: result.recipients,
        pagination: result.pagination,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
