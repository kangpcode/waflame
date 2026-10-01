import { EventEmitter } from 'node:events';
import { prisma } from '@waflame/database';
import { ProviderType } from '@waflame/shared';
import { BaileysProvider } from './providers/baileys.js';

export interface SessionManagerEvents {
  'device:qr': (deviceId: string, qr: string, qrDataUrl: string) => void;
  'device:status': (deviceId: string, status: string, reason?: string) => void;
  'message:inbound': (deviceId: string, message: any) => void;
  'message:receipt': (deviceId: string, receipt: any) => void;
}

export class SessionManager extends EventEmitter {
  private static instance: SessionManager;
  private sessions = new Map<string, BaileysProvider>();

  private constructor() {
    super();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Get an active BaileysProvider instance
   */
  public getSession(deviceId: string): BaileysProvider | undefined {
    return this.sessions.get(deviceId);
  }

  /**
   * Get or create & initialize a Baileys session for a device
   */
  public async getOrCreateSession(deviceId: string): Promise<BaileysProvider> {
    const existing = this.sessions.get(deviceId);
    if (existing) {
      return existing;
    }

    const provider = new BaileysProvider(deviceId, {
      onQR: (qr, qrDataUrl) => {
        this.emit('device:qr', deviceId, qr, qrDataUrl);
      },
      onStatusChange: (status, reason) => {
        this.emit('device:status', deviceId, status, reason);
      },
      onInboundMessage: (msg) => {
        this.emit('message:inbound', deviceId, msg);
      },
      onMessageReceipt: (receipt) => {
        this.emit('message:receipt', deviceId, receipt);
      },
    });

    this.sessions.set(deviceId, provider);
    await provider.initialize();
    return provider;
  }

  /**
   * Disconnect and remove session
   */
  public async removeSession(deviceId: string): Promise<void> {
    const provider = this.sessions.get(deviceId);
    if (provider) {
      await provider.disconnect();
      this.sessions.delete(deviceId);
    }
  }

  /**
   * Restore all previously connected or connecting sessions from MariaDB on service startup
   */
  public async restoreSavedSessions(): Promise<void> {
    const devices = await prisma.device.findMany({
      where: {
        providerType: ProviderType.BAILEYS,
        status: {
          in: ['CONNECTED', 'CONNECTING', 'PAIRING'],
        },
        deletedAt: null,
      },
    });

    console.log(`[SessionManager] Restoring ${devices.length} Baileys sessions from database...`);
    for (const dev of devices) {
      try {
        await this.getOrCreateSession(dev.id);
      } catch (err) {
        console.error(`[SessionManager] Failed to restore session for device ${dev.id}:`, err);
      }
    }
  }
}

export const sessionManager = SessionManager.getInstance();
