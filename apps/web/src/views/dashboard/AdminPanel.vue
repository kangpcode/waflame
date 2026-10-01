<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '../../stores/notification.js';
import {
  ShieldAlert,
  Server,
  Database,
  Radio,
  Building,
  CheckCircle2,
  Users,
  Smartphone,
  Layers,
  Power,
  RefreshCw,
} from 'lucide-vue-next';

const notification = useNotificationStore();

const systemHealth = ref({
  apiStatus: 'HEALTHY',
  mariaDbPool: 'CONNECTED (Pool 10/10)',
  redisStatus: 'CONNECTED (PONG in 1.2ms)',
  bullMqWorkers: '4 WORKERS RUNNING',
  uptime: '99.98%',
});

const tenants = ref([
  {
    id: 't_01',
    name: 'PT Maju Bersama',
    plan: 'Business Flame',
    deviceCount: 2,
    contactCount: 1420,
    status: 'ACTIVE',
    createdAt: '2026-08-01',
  },
  {
    id: 't_02',
    name: 'Toko Baju Nusantara',
    plan: 'Starter',
    deviceCount: 1,
    contactCount: 450,
    status: 'ACTIVE',
    createdAt: '2026-08-15',
  },
  {
    id: 't_03',
    name: 'CV Global Solusindo',
    plan: 'Enterprise Pro',
    deviceCount: 8,
    contactCount: 45200,
    status: 'ACTIVE',
    createdAt: '2026-09-02',
  },
  {
    id: 't_04',
    name: 'Spam Sender Suspended',
    plan: 'Starter',
    deviceCount: 0,
    contactCount: 80,
    status: 'SUSPENDED',
    createdAt: '2026-09-28',
  },
]);

function toggleTenantStatus(t: any) {
  t.status = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  notification.info(`Status tenant ${t.name} diubah menjadi ${t.status}`);
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold mb-2">
          <ShieldAlert class="w-3.5 h-3.5" /> SUPER ADMIN CENTRAL CONTROL
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Super Admin Panel & Monitoring</h1>
        <p class="text-sm text-zinc-400 mt-0.5">Kelola seluruh tenant multi-tenant, pantau kesehatan antrean BullMQ, dan infrastruktur sistem.</p>
      </div>

      <button
        @click="notification.success('Status sistem infrastruktur diperbarui!')"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5"
      >
        <RefreshCw class="w-3.5 h-3.5 text-orange-400" />
        <span>Refresh Status</span>
      </button>
    </div>

    <!-- Infrastructure Status Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-semibold">Fastify REST API</span>
          <Server class="w-4 h-4 text-emerald-400" />
        </div>
        <p class="text-lg font-bold text-white flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {{ systemHealth.apiStatus }}
        </p>
        <p class="text-[11px] text-zinc-500 mt-1">Uptime: {{ systemHealth.uptime }}</p>
      </div>

      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-semibold">MariaDB 11 Database</span>
          <Database class="w-4 h-4 text-blue-400" />
        </div>
        <p class="text-xs font-mono font-bold text-zinc-200">{{ systemHealth.mariaDbPool }}</p>
        <p class="text-[11px] text-zinc-500 mt-1">29 Normalized Tables Active</p>
      </div>

      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-semibold">Redis 7 & Cache</span>
          <Radio class="w-4 h-4 text-rose-400" />
        </div>
        <p class="text-xs font-mono font-bold text-zinc-200">{{ systemHealth.redisStatus }}</p>
        <p class="text-[11px] text-zinc-500 mt-1">Sliding Rate Limiter Ready</p>
      </div>

      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80">
        <div class="flex items-center justify-between text-zinc-400 mb-2">
          <span class="text-xs font-semibold">BullMQ Background Workers</span>
          <Layers class="w-4 h-4 text-orange-400" />
        </div>
        <p class="text-xs font-mono font-bold text-orange-400">{{ systemHealth.bullMqWorkers }}</p>
        <p class="text-[11px] text-zinc-500 mt-1">Messages, Webhooks, CSV, Campaigns</p>
      </div>
    </div>

    <!-- Tenants Management Table -->
    <div class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-white">Daftar Tenant Multi-Tenant Terdaftar</h2>
        <span class="text-xs text-zinc-400 font-mono">{{ tenants.length }} Workspaces</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-zinc-300">
          <thead class="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
            <tr>
              <th class="p-4">Nama Workspace</th>
              <th class="p-4">Paket Langganan</th>
              <th class="p-4">Total Device</th>
              <th class="p-4">Total Kontak</th>
              <th class="p-4">Status</th>
              <th class="p-4">Terdaftar</th>
              <th class="p-4 text-right">Aksi Superadmin</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/50">
            <tr v-for="t in tenants" :key="t.id" class="hover:bg-zinc-800/30 transition-colors">
              <td class="p-4 font-semibold text-white flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xs text-orange-400 border border-zinc-700">
                  <Building class="w-4 h-4" />
                </div>
                <span>{{ t.name }}</span>
              </td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  {{ t.plan }}
                </span>
              </td>
              <td class="p-4 font-mono text-zinc-300">{{ t.deviceCount }} Devices</td>
              <td class="p-4 font-mono text-zinc-300">{{ t.contactCount.toLocaleString('id-ID') }}</td>
              <td class="p-4">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'"
                >
                  {{ t.status }}
                </span>
              </td>
              <td class="p-4 text-zinc-500 font-mono">{{ t.createdAt }}</td>
              <td class="p-4 text-right">
                <button
                  @click="toggleTenantStatus(t)"
                  class="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                  :class="t.status === 'ACTIVE' ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'"
                >
                  {{ t.status === 'ACTIVE' ? 'Suspend' : 'Aktifkan' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
