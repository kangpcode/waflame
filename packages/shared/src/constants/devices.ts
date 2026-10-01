export const ProviderType = {
  OFFICIAL: 'OFFICIAL',
  BAILEYS: 'BAILEYS',
} as const;

export type ProviderTypeValue = (typeof ProviderType)[keyof typeof ProviderType];

export const DeviceStatus = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  PAIRING: 'PAIRING',
  BANNED: 'BANNED',
} as const;

export type DeviceStatusValue = (typeof DeviceStatus)[keyof typeof DeviceStatus];
