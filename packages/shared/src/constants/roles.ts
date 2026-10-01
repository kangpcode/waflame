export const SystemRole = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  AGENT: 'agent',
  API_USER: 'api_user',
} as const;

export type SystemRoleType = (typeof SystemRole)[keyof typeof SystemRole];
