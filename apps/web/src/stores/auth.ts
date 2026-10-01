import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantName?: string;
  role: {
    id?: string;
    code: string;
    name: string;
  };
  permissions: string[];
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('waflame_token'));
  const user = ref<UserProfile | null>(null);
  const loading = ref<boolean>(false);

  const isAuthenticated = computed(() => !!token.value);
  const isSuperAdmin = computed(
    () => user.value?.role.code === 'SUPER_ADMIN' || user.value?.permissions.includes('*')
  );

  function hasPermission(permission: string): boolean {
    if (!user.value) return false;
    if (isSuperAdmin.value) return true;
    return user.value.permissions.includes(permission);
  }

  function hasRole(roleCode: string): boolean {
    if (!user.value) return false;
    return user.value.role.code.toUpperCase() === roleCode.toUpperCase();
  }

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true;
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login gagal, periksa email dan password Anda');
      }

      token.value = data.data.accessToken;
      if (token.value) {
        localStorage.setItem('waflame_token', token.value);
      }
      user.value = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        tenantId: data.data.user.tenantId,
        tenantName: data.data.user.tenant?.name || 'Default Tenant',
        role: data.data.user.role,
        permissions: data.data.user.permissions || [],
      };
      return true;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile(): Promise<boolean> {
    if (!token.value) return false;
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      if (!res.ok) {
        logout();
        return false;
      }
      const data = await res.json();
      if (data.success && data.data) {
        user.value = {
          id: data.data.id,
          email: data.data.email,
          name: data.data.name,
          tenantId: data.data.tenantId,
          tenantName: data.data.tenant?.name || 'Enterprise Workspace',
          role: data.data.role,
          permissions: data.data.permissions || [],
        };
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('waflame_token');
  }

  // Pre-seed demo login for quick developer evaluation
  function setDemoSession(roleCode: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT') {
    const mockToken = 'mock_demo_jwt_token';
    token.value = mockToken;
    localStorage.setItem('waflame_token', mockToken);

    if (roleCode === 'SUPER_ADMIN') {
      user.value = {
        id: 'super-admin-uuid',
        email: 'admin@waflame.com',
        name: 'Super Administrator',
        tenantId: 'system-tenant',
        tenantName: 'Platform Central',
        role: { code: 'SUPER_ADMIN', name: 'Super Admin' },
        permissions: ['*'],
      };
    } else if (roleCode === 'ADMIN') {
      user.value = {
        id: 'tenant-admin-uuid',
        email: 'owner@business.com',
        name: 'Budi (Business Owner)',
        tenantId: 'tenant-demo-uuid',
        tenantName: 'PT Maju Bersama',
        role: { code: 'ADMIN', name: 'Tenant Admin' },
        permissions: [
          'devices:read',
          'devices:create',
          'devices:delete',
          'messages:send',
          'campaigns:read',
          'campaigns:create',
          'contacts:read',
          'contacts:create',
          'inbox:read',
          'inbox:reply',
          'inbox:manage',
          'webhooks:read',
          'webhooks:manage',
          'apikeys:read',
          'apikeys:manage',
        ],
      };
    } else {
      user.value = {
        id: 'cs-agent-uuid',
        email: 'siti.cs@business.com',
        name: 'Siti Rahma (Customer Service)',
        tenantId: 'tenant-demo-uuid',
        tenantName: 'PT Maju Bersama',
        role: { code: 'AGENT', name: 'Customer Service' },
        permissions: ['inbox:read', 'inbox:reply', 'contacts:read'],
      };
    }
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isSuperAdmin,
    hasPermission,
    hasRole,
    login,
    fetchProfile,
    logout,
    setDemoSession,
  };
});
