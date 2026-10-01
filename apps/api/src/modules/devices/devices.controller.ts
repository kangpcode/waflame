import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateDeviceSchema, UpdateDeviceSchema } from '@waflame/shared';
import { DevicesService } from './devices.service.js';

const devicesService = new DevicesService();

export class DevicesController {
  /**
   * POST /api/v1/devices
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const parse = CreateDeviceSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi form perangkat gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const device = await devicesService.createDevice(request.user.tenantId, parse.data);
      return reply.status(201).send({
        success: true,
        message: 'Perangkat berhasil ditambahkan',
        data: device,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Gagal menambahkan perangkat',
      });
    }
  }

  /**
   * GET /api/v1/devices
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const devices = await devicesService.listDevices(request.user.tenantId);
    return reply.status(200).send({
      success: true,
      data: devices,
    });
  }

  /**
   * GET /api/v1/devices/:id
   */
  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const device = await devicesService.getDevice(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: device,
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * PUT /api/v1/devices/:id
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const parse = UpdateDeviceSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi data gagal',
        errors: parse.error.format(),
      });
    }

    try {
      const updated = await devicesService.updateDevice(
        request.user.tenantId,
        id,
        parse.data
      );
      return reply.status(200).send({
        success: true,
        message: 'Pengaturan perangkat berhasil diperbarui',
        data: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * DELETE /api/v1/devices/:id
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      await devicesService.deleteDevice(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        message: 'Perangkat berhasil dihapus',
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * GET /api/v1/devices/:id/qr
   */
  async getQR(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const qrData = await devicesService.getQR(request.user.tenantId, id);
      return reply.status(200).send({
        success: true,
        data: qrData,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/devices/:id/reconnect
   */
  async reconnect(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const result = await devicesService.reconnect(request.user.tenantId, id);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/devices/:id/logout
   */
  async logout(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const result = await devicesService.logout(request.user.tenantId, id);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}
