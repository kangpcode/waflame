export const CampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type CampaignStatusValue = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const CampaignRecipientStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

export type CampaignRecipientStatusValue =
  (typeof CampaignRecipientStatus)[keyof typeof CampaignRecipientStatus];

export const ImportStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type ImportStatusValue = (typeof ImportStatus)[keyof typeof ImportStatus];

export const ImportEntityType = {
  CONTACTS: 'CONTACTS',
  GROUP_INVITES: 'GROUP_INVITES',
} as const;

export type ImportEntityTypeValue = (typeof ImportEntityType)[keyof typeof ImportEntityType];
