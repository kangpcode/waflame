export const QueueName = {
  MESSAGE_SEND: 'waflame-message-send',
  CAMPAIGN_BROADCAST: 'waflame-campaign-broadcast',
  CSV_IMPORT: 'waflame-csv-import',
  GROUP_INVITE: 'waflame-group-invite',
  WEBHOOK_OUTBOUND: 'waflame-webhook-outbound',
} as const;

export type QueueNameValue = (typeof QueueName)[keyof typeof QueueName];

export interface WebhookOutboundJobData {
  tenantId: string;
  webhookId: string;
  url: string;
  secretKey: string;
  event: string;
  payload: any;
}

export interface MessageSendJobData {
  tenantId: string;
  messageId: string;
  deviceId: string;
  to: string;
  type: string;
  text?: string;
  mediaUrl?: string;
  templateId?: string;
  templateParams?: string[];
  scheduledAt?: string;
}

export interface CampaignBroadcastJobData {
  tenantId: string;
  campaignId: string;
}

export interface CsvImportJobData {
  tenantId: string;
  importId: string;
  filePath: string;
  mappingConfig: {
    phoneColumn: string;
    firstNameColumn: string;
    lastNameColumn?: string;
    emailColumn?: string;
    customFieldColumns?: string[];
    groupIds?: string[];
    tagIds?: string[];
    overwriteExisting?: boolean;
  };
}

export interface GroupInviteJobData {
  tenantId: string;
  importId: string;
  deviceId: string;
  groupJid: string;
  filePath: string;
  phoneColumn: string;
  delaySec: number;
}
