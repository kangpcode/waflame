import baileysPkg, {
  WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { pino } from 'pino';
import { prisma } from '@waflame/database';
import {
  DeviceStatus,
  DeviceStatusValue,
  MessageType,
  parseSpintax,
  toWhatsAppJid,
} from '@waflame/shared';
import { useMariaDBAuthState } from '../auth/mariadb-auth-store.js';
import {
  GroupMetadataInfo,
  SendMessagePayload,
  SendMessageResult,
  WhatsAppProvider,
} from '../interfaces/whatsapp-provider.interface.js';

// Resolve CJS / ESM Baileys default export safely
const baileys = (baileysPkg as any).default || baileysPkg;
const makeWASocket: typeof baileysPkg.default =
  typeof (baileysPkg as any).default === 'function' ? (baileysPkg as any).default : baileys;
const DisconnectReason = (baileysPkg as any).DisconnectReason || baileys.DisconnectReason;
const proto = (baileysPkg as any).proto || (baileysPkg as any).WAProto || baileys.proto;

export interface BaileysProviderCallbacks {
  onQR?: (qr: string, qrDataUrl: string) => void;
  onStatusChange?: (status: DeviceStatusValue, reason?: string) => void;
  onInboundMessage?: (message: {
    messageId: string;
    remoteJid: string;
    content?: string;
    type: string;
    mediaUrl?: string;
    timestamp: Date;
    raw: any;
  }) => void;
  onMessageReceipt?: (receipt: {
    messageId: string;
    status: 'DELIVERED' | 'READ';
    timestamp: Date;
  }) => void;
}

export class BaileysProvider implements WhatsAppProvider {
  public socket: WASocket | null = null;
  public status: DeviceStatusValue = DeviceStatus.DISCONNECTED;
  public latestQR: string | null = null;
  public latestQRDataUrl: string | null = null;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    public readonly deviceId: string,
    private readonly callbacks?: BaileysProviderCallbacks
  ) {}

  /**
   * Initialize Baileys socket with MariaDB persistent auth store
   */
  async initialize(): Promise<void> {
    if (this.socket) {
      return;
    }

    this.status = DeviceStatus.CONNECTING;
    this.callbacks?.onStatusChange?.(this.status);

    const { state, saveCreds, clearCreds } = await useMariaDBAuthState(this.deviceId);

    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      browser: ['Waflame Gateway', 'Chrome', '124.0.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    this.socket = sock;

    // 1. Connection Updates (QR, Connected, Disconnected)
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.status = DeviceStatus.PAIRING;
        this.latestQR = qr;
        try {
          this.latestQRDataUrl = await QRCode.toDataURL(qr);
          this.callbacks?.onQR?.(qr, this.latestQRDataUrl);
          this.callbacks?.onStatusChange?.(this.status);
        } catch (err) {
          // ignore qr error
        }
      }

      if (connection === 'open') {
        this.status = DeviceStatus.CONNECTED;
        this.latestQR = null;
        this.latestQRDataUrl = null;
        this.reconnectAttempts = 0;

        // Extract phone number from socket user
        const rawJid = sock.user?.id || '';
        const phone = rawJid.split(':')[0] || rawJid.split('@')[0];

        // Update database device record
        await prisma.device.update({
          where: { id: this.deviceId },
          data: {
            status: DeviceStatus.CONNECTED,
            phoneNumber: phone || undefined,
            lastConnectedAt: new Date(),
            lastActiveAt: new Date(),
          },
        });

        this.callbacks?.onStatusChange?.(this.status);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason?.loggedOut;

        this.socket = null;

        if (shouldReconnect) {
          this.status = DeviceStatus.CONNECTING;
          this.callbacks?.onStatusChange?.(this.status, 'Connection lost, reconnecting...');

          // Exponential backoff reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            this.reconnectTimer = setTimeout(() => {
              this.initialize();
            }, delay);
          } else {
            this.status = DeviceStatus.DISCONNECTED;
            await prisma.device.update({
              where: { id: this.deviceId },
              data: { status: DeviceStatus.DISCONNECTED },
            });
            this.callbacks?.onStatusChange?.(this.status, 'Max reconnection attempts reached');
          }
        } else {
          // Logged out by user: wipe auth credentials
          this.status = DeviceStatus.DISCONNECTED;
          await clearCreds();
          await prisma.device.update({
            where: { id: this.deviceId },
            data: { status: DeviceStatus.DISCONNECTED, phoneNumber: null },
          });
          this.callbacks?.onStatusChange?.(this.status, 'Perangkat telah logout dari WhatsApp');
        }
      }
    });

    // 2. Persist Credentials to MariaDB
    sock.ev.on('creds.update', saveCreds);

    // 3. Inbound Messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid || '';
        let content = '';
        let messageType = 'TEXT';
        let mediaUrl: string | undefined;

        if (msg.message.conversation) {
          content = msg.message.conversation;
          messageType = MessageType.TEXT;
        } else if (msg.message.extendedTextMessage?.text) {
          content = msg.message.extendedTextMessage.text;
          messageType = MessageType.TEXT;
        } else if (msg.message.imageMessage) {
          content = msg.message.imageMessage.caption || '';
          messageType = MessageType.IMAGE;
        } else if (msg.message.videoMessage) {
          content = msg.message.videoMessage.caption || '';
          messageType = MessageType.VIDEO;
        } else if (msg.message.audioMessage) {
          messageType = MessageType.AUDIO;
        } else if (msg.message.documentMessage) {
          content = msg.message.documentMessage.fileName || '';
          messageType = MessageType.DOCUMENT;
        }

        this.callbacks?.onInboundMessage?.({
          messageId: msg.key.id || '',
          remoteJid,
          content,
          type: messageType,
          mediaUrl,
          timestamp: new Date((msg.messageTimestamp as number) * 1000 || Date.now()),
          raw: msg,
        });
      }
    });

    // 4. Message Delivery & Read Receipts
    sock.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (update.update.status && proto) {
          let receiptStatus: 'DELIVERED' | 'READ' | null = null;
          if (update.update.status === proto.WebMessageInfo.Status.DELIVERY_ACK) {
            receiptStatus = 'DELIVERED';
          } else if (update.update.status === proto.WebMessageInfo.Status.READ) {
            receiptStatus = 'READ';
          }

          if (receiptStatus && update.key.id) {
            this.callbacks?.onMessageReceipt?.({
              messageId: update.key.id,
              status: receiptStatus,
              timestamp: new Date(),
            });
          }
        }
      }
    });
  }

  /**
   * Get current connection status
   */
  async getStatus(): Promise<DeviceStatusValue> {
    return this.status;
  }

  /**
   * Disconnect and close socket
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        this.socket.end(undefined);
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }

    this.status = DeviceStatus.DISCONNECTED;
    await prisma.device.update({
      where: { id: this.deviceId },
      data: { status: DeviceStatus.DISCONNECTED },
    });
    this.callbacks?.onStatusChange?.(this.status);
  }

  /**
   * Send WhatsApp message with anti-banned typing simulation
   */
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    if (!this.socket || this.status !== DeviceStatus.CONNECTED) {
      throw new Error('Perangkat belum terhubung ke WhatsApp. Silakan scan QR code terlebih dahulu.');
    }

    // Format destination JID
    const targetJid = payload.to.includes('@') ? payload.to : toWhatsAppJid(payload.to);

    // Anti-banned: Simulate human typing before sending (1.5 - 3 seconds)
    try {
      await this.socket.sendPresenceUpdate('composing', targetJid);
      const typingDelay = Math.floor(Math.random() * 1500) + 1500;
      await new Promise((resolve) => setTimeout(resolve, typingDelay));
      await this.socket.sendPresenceUpdate('paused', targetJid);
    } catch (e) {
      // Non-fatal if presence update fails
    }

    let sentMsg: any;

    switch (payload.type) {
      case MessageType.TEXT: {
        const textContent = payload.content ? parseSpintax(payload.content) : '';
        sentMsg = await this.socket.sendMessage(targetJid, { text: textContent });
        break;
      }

      case MessageType.IMAGE: {
        if (!payload.mediaUrl) throw new Error('mediaUrl wajib diisi untuk pesan gambar');
        sentMsg = await this.socket.sendMessage(targetJid, {
          image: { url: payload.mediaUrl },
          caption: payload.caption || payload.content,
        });
        break;
      }

      case MessageType.VIDEO: {
        if (!payload.mediaUrl) throw new Error('mediaUrl wajib diisi untuk pesan video');
        sentMsg = await this.socket.sendMessage(targetJid, {
          video: { url: payload.mediaUrl },
          caption: payload.caption || payload.content,
        });
        break;
      }

      case MessageType.AUDIO: {
        if (!payload.mediaUrl) throw new Error('mediaUrl wajib diisi untuk pesan audio');
        sentMsg = await this.socket.sendMessage(targetJid, {
          audio: { url: payload.mediaUrl },
          mimetype: payload.mediaType || 'audio/mp4',
          ptt: false,
        });
        break;
      }

      case MessageType.DOCUMENT: {
        if (!payload.mediaUrl) throw new Error('mediaUrl wajib diisi untuk dokumen');
        sentMsg = await this.socket.sendMessage(targetJid, {
          document: { url: payload.mediaUrl },
          mimetype: payload.mediaType || 'application/pdf',
          fileName: payload.fileName || 'dokumen.pdf',
          caption: payload.caption,
        });
        break;
      }

      case MessageType.LOCATION: {
        if (!payload.location) throw new Error('Koordinat lokasi wajib disertakan');
        sentMsg = await this.socket.sendMessage(targetJid, {
          location: {
            degreesLatitude: payload.location.latitude,
            degreesLongitude: payload.location.longitude,
            name: payload.location.name,
            address: payload.location.address,
          },
        });
        break;
      }

      case MessageType.CONTACT: {
        if (!payload.contact) throw new Error('Data kontak vCard wajib disertakan');
        sentMsg = await this.socket.sendMessage(targetJid, {
          contacts: {
            displayName: payload.contact.name,
            contacts: [{ vcard: payload.contact.vcard }],
          },
        });
        break;
      }

      case MessageType.REACTION: {
        if (!payload.reaction) throw new Error('Data reaction emoji & messageId wajib diisi');
        sentMsg = await this.socket.sendMessage(targetJid, {
          react: {
            text: payload.reaction.emoji,
            key: {
              remoteJid: targetJid,
              id: payload.reaction.messageId,
              fromMe: false,
            },
          },
        });
        break;
      }

      case MessageType.POLL: {
        if (!payload.poll) throw new Error('Data polling wajib diisi');
        sentMsg = await this.socket.sendMessage(targetJid, {
          poll: {
            name: payload.poll.name,
            values: payload.poll.values,
            selectableCount: payload.poll.selectableCount || 1,
          },
        });
        break;
      }

      default:
        throw new Error(`Tipe pesan [${payload.type}] tidak didukung oleh Baileys QR engine`);
    }

    return {
      id: sentMsg?.key?.id || '',
      status: 'SENT',
      timestamp: Date.now(),
      rawResponse: sentMsg,
    };
  }

  // -------------------------------------------------------------
  // WhatsApp Groups Implementation
  // -------------------------------------------------------------

  /**
   * Create a new WhatsApp group
   */
  async createGroup(name: string, participants: string[]): Promise<{ jid: string; inviteCode?: string }> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const participantJids = participants.map((p) => (p.includes('@') ? p : toWhatsAppJid(p)));
    const group = await this.socket.groupCreate(name, participantJids);
    let inviteCode: string | undefined;
    try {
      inviteCode = await this.socket.groupInviteCode(group.id);
    } catch (e) {
      // ignore
    }

    return {
      jid: group.id,
      inviteCode,
    };
  }

  /**
   * Fetch all participating WhatsApp groups
   */
  async getGroups(): Promise<GroupMetadataInfo[]> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const groupsMap = await this.socket.groupFetchAllParticipating();
    const result: GroupMetadataInfo[] = [];

    for (const [jid, meta] of Object.entries(groupsMap)) {
      result.push({
        jid,
        subject: meta.subject,
        description: meta.desc,
        owner: meta.owner,
        participants: meta.participants.map((p) => ({
          jid: p.id,
          isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
          isSuperAdmin: p.admin === 'superadmin',
        })),
      });
    }

    return result;
  }

  /**
   * Get metadata for a specific WhatsApp group
   */
  async getGroupMetadata(groupJid: string): Promise<GroupMetadataInfo> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const meta = await this.socket.groupMetadata(groupJid);
    return {
      jid: meta.id,
      subject: meta.subject,
      description: meta.desc,
      owner: meta.owner,
      participants: meta.participants.map((p) => ({
        jid: p.id,
        isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
        isSuperAdmin: p.admin === 'superadmin',
      })),
    };
  }

  /**
   * Invite contacts to group
   */
  async inviteParticipants(groupJid: string, participants: string[]): Promise<any> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const jids = participants.map((p) => (p.includes('@') ? p : toWhatsAppJid(p)));
    return await this.socket.groupParticipantsUpdate(groupJid, jids, 'add');
  }

  /**
   * Remove a participant from group
   */
  async removeParticipant(groupJid: string, participantJid: string): Promise<void> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const jid = participantJid.includes('@') ? participantJid : toWhatsAppJid(participantJid);
    await this.socket.groupParticipantsUpdate(groupJid, [jid], 'remove');
  }

  /**
   * Promote participant to admin
   */
  async promoteAdmin(groupJid: string, participantJid: string): Promise<void> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const jid = participantJid.includes('@') ? participantJid : toWhatsAppJid(participantJid);
    await this.socket.groupParticipantsUpdate(groupJid, [jid], 'promote');
  }

  /**
   * Demote participant from admin
   */
  async demoteAdmin(groupJid: string, participantJid: string): Promise<void> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const jid = participantJid.includes('@') ? participantJid : toWhatsAppJid(participantJid);
    await this.socket.groupParticipantsUpdate(groupJid, [jid], 'demote');
  }

  /**
   * Get group invite link code
   */
  async getInviteLink(groupJid: string): Promise<string> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const code = await this.socket.groupInviteCode(groupJid);
    return `https://chat.whatsapp.com/${code}`;
  }

  /**
   * Reset / revoke group invite link
   */
  async revokeInviteLink(groupJid: string): Promise<string> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    const code = await this.socket.groupRevokeInvite(groupJid);
    return `https://chat.whatsapp.com/${code}`;
  }

  /**
   * Leave a WhatsApp group
   */
  async leaveGroup(groupJid: string): Promise<void> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    await this.socket.groupLeave(groupJid);
  }

  /**
   * Update group subject/name
   */
  async updateGroupName(groupJid: string, name: string): Promise<void> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    await this.socket.groupUpdateSubject(groupJid, name);
  }

  /**
   * Update group description
   */
  async updateGroupDescription(groupJid: string, description: string): Promise<void> {
    if (!this.socket) throw new Error('Socket tidak aktif');
    await this.socket.groupUpdateDescription(groupJid, description);
  }
}
