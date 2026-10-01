import crypto from 'node:crypto';
import { prisma } from '@waflame/database';
import { CreateApiKeyInput, UpdateApiKeyInput } from '@waflame/shared';

export class ApiKeysService {
  /**
   * Create new API Key and return the unhashed secret key only once
   */
  async createApiKey(tenantId: string, input: CreateApiKeyInput) {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullApiKey = `wf_live_${rawSecret}`;
    const prefix = `wf_live_${rawSecret.substring(0, 6)}`;
    const keyHash = crypto.createHash('sha256').update(fullApiKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId,
        name: input.name,
        keyHash,
        prefix,
        permissions: input.permissions,
        rateLimitPerMinute: input.rateLimitPerMinute || 60,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
      },
    });

    return {
      ...apiKey,
      rawApiKey: fullApiKey, // Only returned once!
    };
  }

  async listApiKeys(tenantId: string) {
    return await prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        name: true,
        prefix: true,
        permissions: true,
        rateLimitPerMinute: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateApiKey(tenantId: string, id: string, input: UpdateApiKeyInput) {
    const apiKey = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!apiKey) throw new Error('API Key tidak ditemukan');

    return await prisma.apiKey.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
        ...(input.rateLimitPerMinute !== undefined ? { rateLimitPerMinute: input.rateLimitPerMinute } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        prefix: true,
        permissions: true,
        rateLimitPerMinute: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deleteApiKey(tenantId: string, id: string) {
    const apiKey = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!apiKey) throw new Error('API Key tidak ditemukan');

    await prisma.apiKey.delete({ where: { id } });
    return { message: 'API Key berhasil dihapus' };
  }
}
