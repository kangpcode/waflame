import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

// Public views
import LandingPage from '../views/public/LandingPage.vue';
import Login from '../views/public/Login.vue';
import Register from '../views/public/Register.vue';
import ForgotPassword from '../views/public/ForgotPassword.vue';
import Terms from '../views/public/Terms.vue';
import Privacy from '../views/public/Privacy.vue';
import Docs from '../views/public/Docs.vue';

// Dashboard layout & views
import DashboardLayout from '../layouts/DashboardLayout.vue';
import Overview from '../views/dashboard/Overview.vue';
import Devices from '../views/dashboard/Devices.vue';
import Messages from '../views/dashboard/Messages.vue';
import Campaigns from '../views/dashboard/Campaigns.vue';
import Templates from '../views/dashboard/Templates.vue';
import Contacts from '../views/dashboard/Contacts.vue';
import WhatsAppGroups from '../views/dashboard/WhatsAppGroups.vue';
import Inbox from '../views/dashboard/Inbox.vue';
import AutoReplies from '../views/dashboard/AutoReplies.vue';
import WebhooksOutbound from '../views/dashboard/WebhooksOutbound.vue';
import ApiKeys from '../views/dashboard/ApiKeys.vue';
import Team from '../views/dashboard/Team.vue';
import AuditLogs from '../views/dashboard/AuditLogs.vue';
import Settings from '../views/dashboard/Settings.vue';
import AdminPanel from '../views/dashboard/AdminPanel.vue';

const routes: RouteRecordRaw[] = [
  // Public Routes
  { path: '/', name: 'Landing', component: LandingPage },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
  { path: '/terms', name: 'Terms', component: Terms },
  { path: '/privacy', name: 'Privacy', component: Privacy },
  { path: '/docs', name: 'Docs', component: Docs },

  // Protected Dashboard Routes
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'DashboardOverview', component: Overview },
      { path: 'devices', name: 'DashboardDevices', component: Devices, meta: { permission: 'devices:read' } },
      { path: 'messages', name: 'DashboardMessages', component: Messages, meta: { permission: 'messages:send' } },
      { path: 'campaigns', name: 'DashboardCampaigns', component: Campaigns, meta: { permission: 'campaigns:read' } },
      { path: 'templates', name: 'DashboardTemplates', component: Templates, meta: { permission: 'templates:read' } },
      { path: 'contacts', name: 'DashboardContacts', component: Contacts, meta: { permission: 'contacts:read' } },
      { path: 'groups', name: 'DashboardGroups', component: WhatsAppGroups, meta: { permission: 'devices:read' } },
      { path: 'inbox', name: 'DashboardInbox', component: Inbox, meta: { permission: 'inbox:read' } },
      { path: 'auto-replies', name: 'DashboardAutoReplies', component: AutoReplies, meta: { permission: 'autoreply:read' } },
      { path: 'webhooks', name: 'DashboardWebhooks', component: WebhooksOutbound, meta: { permission: 'webhooks:read' } },
      { path: 'api-keys', name: 'DashboardApiKeys', component: ApiKeys, meta: { permission: 'apikeys:read' } },
      { path: 'team', name: 'DashboardTeam', component: Team, meta: { permission: 'roles:read' } },
      { path: 'audit-logs', name: 'DashboardAuditLogs', component: AuditLogs, meta: { permission: 'audit:read' } },
      { path: 'settings', name: 'DashboardSettings', component: Settings },
      { path: 'admin', name: 'DashboardAdmin', component: AdminPanel, meta: { permission: 'tenants:manage' } },
    ],
  },

  // Fallback redirect
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  // If page requires auth and not authenticated
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!auth.isAuthenticated) {
      return next({ name: 'Login' });
    }

    // If user profile not yet loaded, attempt to load or set default session
    if (!auth.user && auth.token) {
      const ok = await auth.fetchProfile();
      if (!ok && !auth.user) {
        auth.setDemoSession('ADMIN');
      }
    }

    // Check permission requirement
    const requiredPermission = to.meta.permission as string | undefined;
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
      // If unauthorized, redirect to Overview
      return next({ name: 'DashboardOverview' });
    }
  }

  next();
});
