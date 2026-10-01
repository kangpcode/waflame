<script setup lang="ts">
import { ref } from 'vue';
import { History, Shield, Search, Clock } from 'lucide-vue-next';

const searchQuery = ref('');

const auditLogs = ref([
  {
    id: 'aud_1',
    user: 'admin@waflame.com',
    action: 'APIKEY_CREATE',
    entity: 'ApiKey: Zapier Production Key',
    ipAddress: '127.0.0.1',
    time: '2026-10-01 14:21:09',
  },
  {
    id: 'aud_2',
    user: 'admin@waflame.com',
    action: 'WEBHOOK_CREATE',
    entity: 'Webhook: CRM Webhook Integration',
    ipAddress: '127.0.0.1',
    time: '2026-10-01 14:25:09',
  },
  {
    id: 'aud_3',
    user: 'admin@waflame.com',
    action: 'AUTOREPLY_CREATE',
    entity: 'AutoReply: Info Jam Operasional',
    ipAddress: '127.0.0.1',
    time: '2026-10-01 14:26:33',
  },
  {
    id: 'aud_4',
    user: 'owner@business.com',
    action: 'LOGIN',
    entity: 'Session: User Login Success',
    ipAddress: '182.253.12.8',
    time: '2026-10-01 13:40:00',
  },
  {
    id: 'aud_5',
    user: 'owner@business.com',
    action: 'CAMPAIGN_LAUNCH',
    entity: 'Campaign: Flash Sale Awal Bulan',
    ipAddress: '182.253.12.8',
    time: '2026-10-01 10:00:15',
  },
]);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-extrabold text-white tracking-tight">Audit Trail & Keamanan</h1>
      <p class="text-sm text-zinc-400 mt-1">Pencatatan riwayat setiap aksi administratif, perubahan kredensial, dan otentikasi login sistem.</p>
    </div>

    <!-- Logs Table -->
    <div class="rounded-3xl bg-[#121215] border border-zinc-800/80 overflow-hidden shadow-xl">
      <table class="w-full text-left text-xs text-zinc-300">
        <thead class="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
          <tr>
            <th class="p-4">Waktu Kejadian</th>
            <th class="p-4">Pelaku (User)</th>
            <th class="p-4">Jenis Aksi</th>
            <th class="p-4">Entitas Terkait</th>
            <th class="p-4">Alamat IP</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/50">
          <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-zinc-800/30 transition-colors">
            <td class="p-4 font-mono text-zinc-400">{{ log.time }}</td>
            <td class="p-4 font-semibold text-white">{{ log.user }}</td>
            <td class="p-4">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                {{ log.action }}
              </span>
            </td>
            <td class="p-4 text-zinc-300">{{ log.entity }}</td>
            <td class="p-4 font-mono text-zinc-500">{{ log.ipAddress }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
