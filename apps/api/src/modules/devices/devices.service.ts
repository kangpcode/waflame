import { prisma } from '@waflame/database';
import {
  CreateDeviceInput,
  DeviceStatus,
  ProviderType,
  UpdateDeviceInput,
  encryptAES256,
} from '@waflame/shared';
import { sessionManager } from '@waflame/wa-core';
import { env } from '../../config/env.js';

export class DevicesService {
  /**
   * Create a new device for a tenant
   */
  async createDevice(tenantId: string, input: CreateDeviceInput) {
    // 1. Verify tenant device limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        devices: { where: { deletedAt: null } },
      },
    });

    if (!tenant) throw new Error('Tenant tidak ditemukan');

    if (tenant.devices.length >= tenant.maxDevices) {
      throw new Error(
        `Batas kuota perangkat telah tercapai (${tenant.devices.length}/${tenant.maxDevices}). Silakan upgrade paket Anda.`
      );
    }

    // 2. Encrypt official credentials if provided
    let encWabaId: string | undefined;
    let encPhoneNumberId: string | undefined;
    let encAccessToken: string | undefined;

    if (input.providerType === ProviderType.OFFICIAL) {
      if (!input.wabaId || !input.phoneNumberId || !input.accessToken) {
        throw new Error('Official Mode memerlukan wabaId, phoneNumberId, dan accessToken');
      }
      encWabaId = encryptAES256(input.wabaId, env.ENCRYPTION_KEY);
      encPhoneNumberId = encryptAES256(input.phoneNumberId, env.ENCRYPTION_KEY);
      encAccessToken = encryptAES256(input.accessToken, env.ENCRYPTION_KEY);
    }

    // 3. Insert device into database
    const device = await prisma.device.create({
      data: {
        tenantId,
        name: input.name,
        providerType: input.providerType,
        phoneNumber: input.phoneNumber,
        status: DeviceStatus.DISCONNECTED,
        wabaId: encWabaId,
        phoneNumberId: encPhoneNumberId,
        accessToken: encAccessToken,
        isWarmupMode: input.isWarmupMode ?? false,
        dailyLimit: input.dailyLimit ?? 500,
        delayMinMs: input.delayMinMs ?? 3000,
        delayMaxMs: input.delayMaxMs ?? 8000,
      },
    });

    // 4. If Baileys QR Mode, initialize session to generate initial QR
    if (input.providerType === ProviderType.BAILEYS) {
      try {
        await sessionManager.getOrCreateSession(device.id);
      } catch (err) {
        console.error(`Failed to initialize session for device ${device.id}:`, err);
      }
    }

    return device;
  }

  /**
   * List all devices belonging to tenant
   */
  async listDevices(tenantId: string) {
    const devices = await prisma.device.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            messages: true,
            conversations: true,
          },
        },
      },
    });

    return devices.map((d) => ({
      id: d.id,
      name: d.name,
      phoneNumber: d.phoneNumber,
      providerType: d.providerType,
      status: d.status,
      isWarmupMode: d.isWarmupMode,
      dailyLimit: d.dailyLimit,
      delayMinMs: d.delayMinMs,
      delayMaxMs: d.delayMaxMs,
      lastConnectedAt: d.lastConnectedAt,
      lastActiveAt: d.lastActiveAt,
      messageCount: d._count.messages,
      conversationCount: d._count.conversations,
      createdAt: d.createdAt,
    }));
  }

  /**
   * Get single device details
   */
  async getDevice(tenantId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
      include: {
        _count: {
          select: {
            messages: true,
            conversations: true,
          },
        },
      },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');

    const activeSession = sessionManager.getSession(deviceId);

    return {
      ...device,
      wabaId: undefined,
      accessToken: undefined,
      phoneNumberId: undefined,
      liveStatus: activeSession ? await activeSession.getStatus() : device.status,
      latestQRDataUrl: activeSession?.latestQRDataUrl || null,
      messageCount: device._count.messages,
      conversationCount: device._count.conversations,
    };
  }

  /**
   * Update device settings
   */
  async updateDevice(tenantId: string, deviceId: string, input: UpdateDeviceInput) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');

    return await prisma.device.update({
      where: { id: deviceId },
      data: {
        name: input.name,
        isWarmupMode: input.isWarmupMode,
        dailyLimit: input.dailyLimit,
        delayMinMs: input.delayMinMs,
        delayMaxMs: input.delayMaxMs,
      },
    });
  }

  /**
   * Delete device & purge sessions
   */
  async deleteDevice(tenantId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');

    // Close and remove Baileys session
    await sessionManager.removeSession(deviceId);

    // Soft delete device
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        deletedAt: new Date(),
        status: DeviceStatus.DISCONNECTED,
      },
    });

    // Wipe session tokens from MariaDB
    await prisma.waSession.deleteMany({
      where: { deviceId },
    });
  }

  /**
   * Get QR Code for pairing
   */
  async getQR(tenantId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');
    if (device.providerType !== ProviderType.BAILEYS) {
      throw new Error('Fitur scan QR hanya berlaku untuk QR Mode (Baileys)');
    }

    const provider = await sessionManager.getOrCreateSession(deviceId);

    return {
      deviceId,
      status: provider.status,
      qr: provider.latestQR,
      qrDataUrl: provider.latestQRDataUrl,
    };
  }

  /**
   * Reconnect device
   */
  async reconnect(tenantId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');

    await sessionManager.removeSession(deviceId);
    await sessionManager.getOrCreateSession(deviceId);

    return {
      success: true,
      message: 'Perintah reconnect telah dikirimkan',
    };
  }

  /**
   * Logout / Unpair WhatsApp device
   */
  async logout(tenantId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');

    const provider = sessionManager.getSession(deviceId);
    if (provider) {
      await provider.disconnect();
    }

    await prisma.waSession.deleteMany({
      where: { deviceId },
    });

    await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.DISCONNECTED,
        phoneNumber: null,
      },
    });

    return {
      success: true,
      message: 'Perangkat berhasil di-unpair / logout',
    };
  }
}
