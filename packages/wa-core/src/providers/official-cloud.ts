import { prisma } from '@waflame/database';
import {
  DeviceStatus,
  DeviceStatusValue,
  MessageType,
  normalizePhoneNumber,
} from '@waflame/shared';
import {
  SendMessagePayload,
  SendMessageResult,
  WhatsAppProvider,
} from '../interfaces/whatsapp-provider.interface.js';

export interface OfficialCloudConfig {
  deviceId: string;
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
}

export class OfficialCloudProvider implements WhatsAppProvider {
  private apiVersion: string;

  constructor(private readonly config: OfficialCloudConfig) {
    this.apiVersion = config.apiVersion || 'v21.0';
  }

  /**
   * Verify token and fetch status from Meta Graph API
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.config.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as any)?.error?.message ||
            `Kredensial Meta Cloud API tidak valid (HTTP ${response.status})`
        );
      }

      await prisma.device.update({
        where: { id: this.config.deviceId },
        data: {
          status: DeviceStatus.CONNECTED,
          lastConnectedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });
    } catch (err: any) {
      await prisma.device.update({
        where: { id: this.config.deviceId },
        data: { status: DeviceStatus.DISCONNECTED },
      });
      throw err;
    }
  }

  async getStatus(): Promise<DeviceStatusValue> {
    const device = await prisma.device.findUnique({
      where: { id: this.config.deviceId },
      select: { status: true },
    });
    return (device?.status as DeviceStatusValue) || DeviceStatus.DISCONNECTED;
  }

  async disconnect(): Promise<void> {
    await prisma.device.update({
      where: { id: this.config.deviceId },
      data: { status: DeviceStatus.DISCONNECTED },
    });
  }

  /**
   * Check 24-hour customer service window
   */
  async check24HourWindow(recipientPhone: string): Promise<boolean> {
    const targetJid = `${recipientPhone}@s.whatsapp.net`;

    const lastInbound = await prisma.message.findFirst({
      where: {
        deviceId: this.config.deviceId,
        remoteJid: targetJid,
        direction: 'INBOUND',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastInbound) {
      return false;
    }

    const elapsedMs = Date.now() - new Date(lastInbound.createdAt).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    return elapsedMs < twentyFourHoursMs;
  }

  /**
   * Send WhatsApp message via Meta Graph API
   */
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    const cleanNumber = normalizePhoneNumber(payload.to);

    // 1. Enforce 24-Hour Customer Service Window Rule
    if (payload.type !== MessageType.TEMPLATE) {
      const isWithinWindow = await this.check24HourWindow(cleanNumber);
      if (!isWithinWindow) {
        throw new Error(
          'Jendela layanan pelanggan 24 jam (Customer Service Window) telah berakhir. ' +
            'Meta mewajibkan penggunaan Template Pesan Resmi (Template Message) yang telah disetujui untuk memulai percakapan di luar jendela 24 jam.'
        );
      }
    }

    // 2. Build Meta Cloud API Request Body
    const body: Record<string, any> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanNumber,
    };

    switch (payload.type) {
      case MessageType.TEXT: {
        body.type = 'text';
        body.text = {
          preview_url: true,
          body: payload.content || '',
        };
        break;
      }

      case MessageType.IMAGE: {
        body.type = 'image';
        body.image = {
          link: payload.mediaUrl,
          caption: payload.caption || payload.content,
        };
        break;
      }

      case MessageType.VIDEO: {
        body.type = 'video';
        body.video = {
          link: payload.mediaUrl,
          caption: payload.caption || payload.content,
        };
        break;
      }

      case MessageType.AUDIO: {
        body.type = 'audio';
        body.audio = {
          link: payload.mediaUrl,
        };
        break;
      }

      case MessageType.DOCUMENT: {
        body.type = 'document';
        body.document = {
          link: payload.mediaUrl,
          caption: payload.caption,
          filename: payload.fileName || 'dokumen.pdf',
        };
        break;
      }

      case MessageType.LOCATION: {
        body.type = 'location';
        body.location = {
          latitude: payload.location?.latitude,
          longitude: payload.location?.longitude,
          name: payload.location?.name,
          address: payload.location?.address,
        };
        break;
      }

      case MessageType.CONTACT: {
        body.type = 'contacts';
        body.contacts = [
          {
            name: { formatted_name: payload.contact?.name || 'Kontak' },
            phones: [{ phone: payload.contact?.vcard || '' }],
          },
        ];
        break;
      }

      case MessageType.INTERACTIVE: {
        body.type = 'interactive';
        body.interactive = payload.interactive;
        break;
      }

      case MessageType.REACTION: {
        body.type = 'reaction';
        body.reaction = {
          message_id: payload.reaction?.messageId,
          emoji: payload.reaction?.emoji,
        };
        break;
      }

      case MessageType.TEMPLATE: {
        if (!payload.templateName) {
          throw new Error('templateName wajib diisi untuk pesan template');
        }
        body.type = 'template';
        body.template = {
          name: payload.templateName,
          language: {
            code: payload.templateLanguage || 'id',
          },
          components: payload.templateComponents || [],
        };
        break;
      }

      default:
        throw new Error(`Tipe pesan [${payload.type}] tidak didukung oleh Meta Cloud API`);
    }

    // 3. Dispatch HTTP Request to Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const resJson: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errDetail = resJson?.error;
      const code = errDetail?.code || response.status;
      const message = errDetail?.message || 'Gagal mengirim pesan via Meta Cloud API';
      const subcode = errDetail?.error_subcode ? ` (Subcode: ${errDetail.error_subcode})` : '';

      throw new Error(`Meta Cloud API Error [${code}${subcode}]: ${message}`);
    }

    const messageId = resJson?.messages?.[0]?.id || '';

    return {
      id: messageId,
      status: 'SENT',
      timestamp: Date.now(),
      rawResponse: resJson,
    };
  }

  // -------------------------------------------------------------
  // Meta Cloud API Message Templates
  // -------------------------------------------------------------

  /**
   * Fetch approved message templates from Meta WABA
   */
  async fetchTemplates(): Promise<any[]> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${this.config.wabaId}/message_templates?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || 'Gagal mengambil template dari Meta');
    }

    const res = await response.json();
    return (res as any)?.data || [];
  }

  /**
   * Create a new Message Template on Meta WABA
   */
  async createTemplate(templateData: {
    name: string;
    category: string;
    language: string;
    components: any[];
  }): Promise<any> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${this.config.wabaId}/message_templates`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      }
    );

    const resJson = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        (resJson as any)?.error?.message || 'Gagal membuat template pada Meta Cloud API'
      );
    }

    return resJson;
  }

  // -------------------------------------------------------------
  // WhatsApp Groups Eligibility Check
  // -------------------------------------------------------------

  async createGroup(): Promise<never> {
    throw new Error(
      'Official WhatsApp Cloud API Groups API saat ini hanya tersedia terbatas untuk akun WABA terpilih (Beta). Gunakan QR Mode untuk manajemen grup bebas.'
    );
  }

  async getGroups(): Promise<never> {
    throw new Error(
      'Official WhatsApp Cloud API Groups API saat ini hanya tersedia terbatas untuk akun WABA terpilih (Beta). Gunakan QR Mode untuk melihat daftar grup.'
    );
  }
}
