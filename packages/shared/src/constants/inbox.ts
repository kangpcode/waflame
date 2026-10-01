export const ConversationStatus = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
} as const;

export type ConversationStatusValue =
  (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const AutoReplyTriggerType = {
  EXACT: 'EXACT',
  CONTAINS: 'CONTAINS',
  REGEX: 'REGEX',
  WELCOME: 'WELCOME',
  FALLBACK: 'FALLBACK',
} as const;

export type AutoReplyTriggerTypeValue =
  (typeof AutoReplyTriggerType)[keyof typeof AutoReplyTriggerType];

export const AutoReplyResponseType = {
  TEXT: 'TEXT',
  MEDIA: 'MEDIA',
  TEMPLATE: 'TEMPLATE',
} as const;

export type AutoReplyResponseTypeValue =
  (typeof AutoReplyResponseType)[keyof typeof AutoReplyResponseType];

export const WebhookEvent = {
  MESSAGE_INBOUND: 'message.inbound',
  MESSAGE_STATUS: 'message.status',
  DEVICE_STATUS: 'device.status',
} as const;

export type WebhookEventValue = (typeof WebhookEvent)[keyof typeof WebhookEvent];
