export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
  LOCATION: 'LOCATION',
  CONTACT: 'CONTACT',
  INTERACTIVE: 'INTERACTIVE',
  TEMPLATE: 'TEMPLATE',
  REACTION: 'REACTION',
  POLL: 'POLL',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

export const MessageDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const;

export type MessageDirectionValue = (typeof MessageDirection)[keyof typeof MessageDirection];

export const MessageStatus = {
  QUEUED: 'QUEUED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const;

export type MessageStatusValue = (typeof MessageStatus)[keyof typeof MessageStatus];
