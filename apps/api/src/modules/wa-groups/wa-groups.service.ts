import { prisma } from '@waflame/database';
import { sessionManager } from '@waflame/wa-core';

export class WaGroupsService {
  /**
   * Helper to ensure device is connected and retrieve provider
   */
  private async getConnectedProvider(tenantId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, tenantId, deletedAt: null },
    });

    if (!device) throw new Error('Perangkat tidak ditemukan');

    const provider = sessionManager.getSession(deviceId);
    if (!provider || provider.status !== 'CONNECTED') {
      throw new Error(`Perangkat [${device.name}] belum terhubung ke WhatsApp`);
    }

    return provider;
  }

  /**
   * List all WhatsApp groups on the device
   */
  async getGroups(tenantId: string, deviceId: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.getGroups) {
      throw new Error('Fitur grup tidak didukung pada engine perangkat ini');
    }
    return await provider.getGroups();
  }

  /**
   * Create a new WhatsApp group
   */
  async createGroup(tenantId: string, deviceId: string, name: string, participants: string[]) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.createGroup) {
      throw new Error('Fitur buat grup tidak didukung');
    }
    return await provider.createGroup(name, participants);
  }

  /**
   * Get metadata / participants of a group
   */
  async getGroupMetadata(tenantId: string, deviceId: string, groupJid: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.getGroupMetadata) {
      throw new Error('Fitur metadata grup tidak didukung');
    }
    return await provider.getGroupMetadata(groupJid);
  }

  /**
   * Invite contacts to group
   */
  async inviteParticipants(tenantId: string, deviceId: string, groupJid: string, participants: string[]) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.inviteParticipants) {
      throw new Error('Fitur undang peserta tidak didukung');
    }
    return await provider.inviteParticipants(groupJid, participants);
  }

  /**
   * Kick participant from group
   */
  async removeParticipant(tenantId: string, deviceId: string, groupJid: string, participantJid: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.removeParticipant) {
      throw new Error('Fitur kick peserta tidak didukung');
    }
    await provider.removeParticipant(groupJid, participantJid);
  }

  /**
   * Promote participant to admin
   */
  async promoteAdmin(tenantId: string, deviceId: string, groupJid: string, participantJid: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.promoteAdmin) {
      throw new Error('Fitur promote admin tidak didukung');
    }
    await provider.promoteAdmin(groupJid, participantJid);
  }

  /**
   * Demote admin to regular member
   */
  async demoteAdmin(tenantId: string, deviceId: string, groupJid: string, participantJid: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.demoteAdmin) {
      throw new Error('Fitur demote admin tidak didukung');
    }
    await provider.demoteAdmin(groupJid, participantJid);
  }

  /**
   * Get group invite link
   */
  async getInviteLink(tenantId: string, deviceId: string, groupJid: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.getInviteLink) {
      throw new Error('Fitur link undangan tidak didukung');
    }
    return await provider.getInviteLink(groupJid);
  }

  /**
   * Revoke & generate new invite link
   */
  async revokeInviteLink(tenantId: string, deviceId: string, groupJid: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.revokeInviteLink) {
      throw new Error('Fitur reset link undangan tidak didukung');
    }
    return await provider.revokeInviteLink(groupJid);
  }

  /**
   * Leave WhatsApp group
   */
  async leaveGroup(tenantId: string, deviceId: string, groupJid: string) {
    const provider = await this.getConnectedProvider(tenantId, deviceId);
    if (!provider.leaveGroup) {
      throw new Error('Fitur keluar grup tidak didukung');
    }
    await provider.leaveGroup(groupJid);
  }
}
