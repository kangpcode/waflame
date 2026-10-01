export const Permission = {
  // Device Permissions
  DEVICE_READ: 'device:read',
  DEVICE_CREATE: 'device:create',
  DEVICE_UPDATE: 'device:update',
  DEVICE_DELETE: 'device:delete',
  DEVICE_MANAGE: 'device:manage', // QR scan, reconnect, restart

  // Message Permissions
  MESSAGE_READ: 'message:read',
  MESSAGE_SEND: 'message:send',

  // Campaign Permissions
  CAMPAIGN_READ: 'campaign:read',
  CAMPAIGN_CREATE: 'campaign:create',
  CAMPAIGN_START: 'campaign:start',
  CAMPAIGN_PAUSE: 'campaign:pause',
  CAMPAIGN_RESUME: 'campaign:resume',
  CAMPAIGN_CANCEL: 'campaign:cancel',

  // Contact Permissions
  CONTACT_READ: 'contact:read',
  CONTACT_CREATE: 'contact:create',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',
  CONTACT_MANAGE: 'contact:manage',
  CONTACT_IMPORT: 'contact:import',
  CONTACT_EXPORT: 'contact:export',

  // WhatsApp Group Permissions
  GROUP_READ: 'group:read',
  GROUP_CREATE: 'group:create',
  GROUP_MANAGE: 'group:manage',

  // Inbox & Live Chat Permissions
  INBOX_READ: 'inbox:read',
  INBOX_REPLY: 'inbox:reply',
  INBOX_MANAGE: 'inbox:manage',

  // Auto Reply / Bot Permissions
  BOT_READ: 'bot:read',
  BOT_MANAGE: 'bot:manage',

  // Webhook Permissions
  WEBHOOK_READ: 'webhook:read',
  WEBHOOK_MANAGE: 'webhook:manage',

  // API Key Permissions
  APIKEY_MANAGE: 'apikey:manage',

  // Team & Role Management
  TEAM_READ: 'team:read',
  TEAM_INVITE: 'team:invite',
  TEAM_MANAGE: 'team:manage',

  // Billing Permissions
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',

  // Super Admin Platform Permission
  SUPERADMIN_MANAGE: 'superadmin:manage',
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];
