<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useThemeStore } from '../stores/theme.js';
import { useI18n } from 'vue-i18n';
import {
  Flame,
  LayoutDashboard,
  Smartphone,
  Send,
  Radio,
  FileText,
  Users,
  MessageSquare,
  Bot,
  Webhook,
  KeyRound,
  ShieldCheck,
  History,
  Settings,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const theme = useThemeStore();
const { t, locale } = useI18n();

const isSidebarOpen = ref(true);
const isUserDropdownOpen = ref(false);

const navItems = computed(() => [
  {
    label: t('nav.overview'),
    path: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    label: t('nav.devices'),
    path: '/dashboard/devices',
    icon: Smartphone,
    permission: 'devices:read',
  },
  {
    label: t('nav.messages'),
    path: '/dashboard/messages',
    icon: Send,
    permission: 'messages:send',
  },
  {
    label: t('nav.campaigns'),
    path: '/dashboard/campaigns',
    icon: Radio,
    permission: 'campaigns:read',
  },
  {
    label: t('nav.templates'),
    path: '/dashboard/templates',
    icon: FileText,
    permission: 'templates:read',
  },
  {
    label: t('nav.contacts'),
    path: '/dashboard/contacts',
    icon: Users,
    permission: 'contacts:read',
  },
  {
    label: t('nav.waGroups'),
    path: '/dashboard/groups',
    icon: Layers,
    permission: 'devices:read',
  },
  {
    label: t('nav.inbox'),
    path: '/dashboard/inbox',
    icon: MessageSquare,
    permission: 'inbox:read',
    badge: 'Live',
  },
  {
    label: t('nav.autoReplies'),
    path: '/dashboard/auto-replies',
    icon: Bot,
    permission: 'autoreply:read',
  },
  {
    label: t('nav.webhooks'),
    path: '/dashboard/webhooks',
    icon: Webhook,
    permission: 'webhooks:read',
  },
  {
    label: t('nav.apiKeys'),
    path: '/dashboard/api-keys',
    icon: KeyRound,
    permission: 'apikeys:read',
  },
  {
    label: t('nav.team'),
    path: '/dashboard/team',
    icon: ShieldCheck,
    permission: 'roles:read',
  },
  {
    label: t('nav.auditLogs'),
    path: '/dashboard/audit-logs',
    icon: History,
    permission: 'audit:read',
  },
  {
    label: t('nav.admin'),
    path: '/dashboard/admin',
    icon: ShieldAlert,
    permission: 'tenants:manage',
    superAdminOnly: true,
  },
]);

const filteredNavItems = computed(() => {
  return navItems.value.filter((item) => {
    if (item.superAdminOnly && !auth.isSuperAdmin) return false;
    if (item.permission && !auth.hasPermission(item.permission)) return false;
    return true;
  });
});

function toggleLocale() {
  locale.value = locale.value === 'id' ? 'en' : 'id';
  localStorage.setItem('waflame_locale', locale.value);
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}

function switchDemoRole(role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT') {
  auth.setDemoSession(role);
  isUserDropdownOpen.value = false;
  router.push('/dashboard');
}
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5] flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 bg-[#121215] border-r border-zinc-800/80 transition-all duration-300 flex flex-col"
      :class="isSidebarOpen ? 'w-64' : 'w-20'"
    >
      <!-- Logo Brand -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-zinc-800/80">
        <router-link to="/dashboard" class="flex items-center gap-3 overflow-hidden">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Flame class="w-6 h-6 text-white" />
          </div>
          <div v-if="isSidebarOpen" class="flex flex-col">
            <span class="font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
              WAFLAME
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">PRO</span>
            </span>
            <span class="text-[11px] text-zinc-400 -mt-0.5">WhatsApp Gateway</span>
          </div>
        </router-link>
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
        >
          <Menu v-if="!isSidebarOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        <router-link
          v-for="item in filteredNavItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group relative"
          :class="
            route.path === item.path
              ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-400 border border-orange-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          "
        >
          <component
            :is="item.icon"
            class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
            :class="route.path === item.path ? 'text-orange-400' : 'text-zinc-400'"
          />
          <span v-if="isSidebarOpen" class="truncate flex-1">{{ item.label }}</span>
          <span
            v-if="isSidebarOpen && item.badge"
            class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0"
          >
            {{ item.badge }}
          </span>
        </router-link>
      </nav>

      <!-- Tenant & Connection Status Pill -->
      <div v-if="isSidebarOpen" class="p-3 border-t border-zinc-800/80">
        <div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span class="font-medium text-zinc-300">Dual Engine Active</span>
          </div>
          <span class="text-[10px] text-zinc-400">Meta + Baileys</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div
      class="flex-1 flex flex-col min-w-0 transition-all duration-300"
      :class="isSidebarOpen ? 'ml-64' : 'ml-20'"
    >
      <!-- Topbar Header -->
      <header class="h-16 bg-[#121215]/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-30 flex items-center justify-between px-6">
        <!-- Breadcrumbs & Quick Role Indicator -->
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-zinc-200">
            {{ auth.user?.tenantName || 'Enterprise Workspace' }}
          </span>
          <span class="text-zinc-600">/</span>
          <span class="text-xs px-2.5 py-1 rounded-full font-medium border"
            :class="{
              'bg-orange-500/10 border-orange-500/30 text-orange-400': auth.isSuperAdmin,
              'bg-blue-500/10 border-blue-500/30 text-blue-400': auth.hasRole('ADMIN'),
              'bg-purple-500/10 border-purple-500/30 text-purple-400': auth.hasRole('AGENT'),
            }"
          >
            {{ auth.user?.role.name || 'Admin' }}
          </span>
        </div>

        <!-- Right Action Controls -->
        <div class="flex items-center gap-3">
          <!-- Language Toggle -->
          <button
            @click="toggleLocale"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
            title="Ganti Bahasa (ID / EN)"
          >
            <Globe class="w-3.5 h-3.5 text-orange-400" />
            <span class="uppercase font-bold">{{ locale }}</span>
          </button>

          <!-- Theme Toggle -->
          <button
            @click="theme.toggle()"
            class="p-2 rounded-lg text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
            title="Toggle Dark / Light Mode"
          >
            <Sun v-if="theme.isDark" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-orange-400" />
          </button>

          <!-- User Menu Dropdown -->
          <div class="relative">
            <button
              @click="isUserDropdownOpen = !isUserDropdownOpen"
              class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
            >
              <div class="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs border border-orange-500/30">
                {{ auth.user?.name?.charAt(0) || 'U' }}
              </div>
              <div class="text-left hidden sm:block">
                <p class="text-xs font-semibold text-zinc-200 leading-none">{{ auth.user?.name || 'Administrator' }}</p>
                <p class="text-[10px] text-zinc-400 leading-none mt-1">{{ auth.user?.email || 'admin@waflame.com' }}</p>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <!-- Dropdown Menu Box -->
            <div
              v-if="isUserDropdownOpen"
              class="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div class="px-3 py-2 border-b border-zinc-800 mb-1">
                <p class="text-xs text-zinc-400">Simulasi Role (Quick Switch):</p>
                <div class="grid grid-cols-3 gap-1 mt-2">
                  <button
                    @click="switchDemoRole('SUPER_ADMIN')"
                    class="px-1.5 py-1 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/40"
                  >
                    Super
                  </button>
                  <button
                    @click="switchDemoRole('ADMIN')"
                    class="px-1.5 py-1 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40"
                  >
                    Owner
                  </button>
                  <button
                    @click="switchDemoRole('AGENT')"
                    class="px-1.5 py-1 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40"
                  >
                    CS
                  </button>
                </div>
              </div>

              <router-link
                to="/dashboard/settings"
                @click="isUserDropdownOpen = false"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
              >
                <Settings class="w-4 h-4 text-zinc-400" />
                Pengaturan Akun
              </router-link>

              <button
                @click="handleLogout"
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
              >
                <LogOut class="w-4 h-4 text-rose-400" />
                Keluar (Logout)
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main View Content -->
      <main class="flex-1 p-6 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>
