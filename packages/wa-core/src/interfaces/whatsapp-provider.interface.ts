import { MessageTypeValue } from '@waflame/shared';

export interface SendMessagePayload {
  to: string; // E.164 formatted number or JID
  type: MessageTypeValue;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
  fileName?: string;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contact?: { name: string; vcard: string };
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  interactive?: any;
  reaction?: { messageId: string; emoji: string };
  poll?: { name: string; values: string[]; selectableCount?: number };
}

export interface SendMessageResult {
  id: string; // Message ID from Meta or Baileys
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  timestamp: number;
  rawResponse?: any;
}

export interface GroupParticipant {
  jid: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
}

export interface GroupMetadataInfo {
  jid: string;
  subject: string;
  description?: string;
  owner?: string;
  participants: GroupParticipant[];
  inviteCode?: string;
}

export interface WhatsAppProvider {
  initialize(): Promise<void>;
  sendMessage(payload: SendMessagePayload): Promise<SendMessageResult>;
  disconnect(): Promise<void>;
  getStatus(): Promise<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'PAIRING' | 'BANNED'>;

  // WhatsApp Groups
  createGroup?(name: string, participants: string[]): Promise<{ jid: string; inviteCode?: string }>;
  getGroups?(): Promise<GroupMetadataInfo[]>;
  getGroupMetadata?(groupJid: string): Promise<GroupMetadataInfo>;
  inviteParticipants?(groupJid: string, participants: string[]): Promise<any>;
  removeParticipant?(groupJid: string, participantJid: string): Promise<void>;
  promoteAdmin?(groupJid: string, participantJid: string): Promise<void>;
  demoteAdmin?(groupJid: string, participantJid: string): Promise<void>;
  getInviteLink?(groupJid: string): Promise<string>;
  revokeInviteLink?(groupJid: string): Promise<string>;
  leaveGroup?(groupJid: string): Promise<void>;
}
