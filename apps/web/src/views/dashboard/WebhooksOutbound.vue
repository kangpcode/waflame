<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  Webhook,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  KeyRound,
  X,
  History,
} from 'lucide-vue-next';

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt?: string;
  successRate: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const webhooks = ref<WebhookItem[]>([
  {
    id: 'wh_01',
    name: 'Sistem CRM Utama (HubSpot Sync)',
    url: 'https://api.crm-perusahaan.com/webhooks/waflame',
    events: ['message.inbound', 'message.status'],
    isActive: true,
    lastTriggeredAt: '5 menit yang lalu',
    successRate: '99.4%',
  },
  {
    id: 'wh_02',
    name: 'Server Notifikasi Internal (Slack Bot)',
    url: 'https://hooks.slack.com/services/T00/B00/XXXXX',
    events: ['device.status'],
    isActive: true,
    lastTriggeredAt: '2 jam yang lalu',
    successRate: '100%',
  },
]);

const isAddModalOpen = ref(false);
const isLogsModalOpen = ref(false);

const formName = ref('');
const formUrl = ref('');
const formSecret = ref('');
const formEvents = ref<string[]>(['message.inbound', 'message.status']);

const sampleLogs = [
  { id: 'log_1', event: 'message.inbound', status: 200, latency: '42ms', time: '14:28:10' },
  { id: 'log_2', event: 'message.status', status: 200, latency: '38ms', time: '14:28:12' },
  { id: 'log_3', event: 'device.status', status: 200, latency: '65ms', time: '12:00:00' },
];

function handleCreateWebhook() {
  if (!formName.value || !formUrl.value || !formSecret.value) {
    notification.warning('Semua kolom form webhook wajib diisi');
    return;
  }

  webhooks.value.unshift({
    id: 'wh_' + Date.now(),
    name: formName.value,
    url: formUrl.value,
    events: [...formEvents.value],
    isActive: true,
    lastTriggeredAt: 'Belum pernah',
    successRate: '100%',
  });

  notification.success('Webhook outbound berhasil ditambahkan!');
  isAddModalOpen.value = false;
  formName.value = '';
  formUrl.value = '';
  formSecret.value = '';
}

function handleTestPing(wh: WebhookItem) {
  notification.info(`Mengirim payload simulasi webhook ke ${wh.url}...`);
  setTimeout(() => {
    notification.success(`Ping webhook sukses! HTTP 200 OK diterima dalam 48ms.`);
  }, 800);
}

function handleDeleteWebhook(id: string) {
  webhooks.value = webhooks.value.filter((w) => w.id !== id);
  notification.success('Webhook berhasil dihapus');
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Outbound Webhooks</h1>
        <p class="text-sm text-zinc-400 mt-1">Teruskan pesan masuk dan status pesan secara instan ke sistem pihak ketiga dengan tanda tangan HMAC-SHA256.</p>
      </div>

      <button
        @click="isAddModalOpen = true"
        class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2 self-start"
      >
        <Plus class="w-4 h-4" />
        <span>Tambah Endpoint Webhook</span>
      </button>
    </div>

    <!-- Webhooks List -->
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="wh in webhooks"
        :key="wh.id"
        class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="space-y-2 flex-1">
          <div class="flex items-center gap-3">
            <h3 class="font-bold text-base text-white">{{ wh.name }}</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              AKTIF
            </span>
            <span class="text-xs text-zinc-400">Success Rate: <strong class="text-emerald-400">{{ wh.successRate }}</strong></span>
          </div>

          <p class="text-xs font-mono text-orange-400 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800/80 inline-block">
            {{ wh.url }}
          </p>

          <div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span class="text-zinc-500">Event Berlangganan:</span>
            <span
              v-for="ev in wh.events"
              :key="ev"
              class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]"
            >
              {{ ev }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="handleTestPing(wh)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <Send class="w-3.5 h-3.5 text-orange-400" />
            <span>Test Ping</span>
          </button>

          <button
            @click="isLogsModalOpen = true"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <History class="w-3.5 h-3.5" />
            <span>Lihat Log</span>
          </button>

          <button
            @click="handleDeleteWebhook(wh.id)"
            class="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Webhook -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isAddModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Tambah Endpoint Webhook Outbound</h2>
        <form @submit.prevent="handleCreateWebhook" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nama Webhook</label>
            <input v-model="formName" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="CRM Webhook Notification" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Target Endpoint URL (HTTPS)</label>
            <input v-model="formUrl" type="url" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono" placeholder="https://domain.com/api/waflame-receiver" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Secret Key (Untuk Verifikasi Tanda Tangan HMAC-SHA256)</label>
            <input v-model="formSecret" type="text" minlength="16" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono" placeholder="my_custom_super_secret_webhook_key_123" />
          </div>

          <div class="pt-3 flex justify-end gap-3">
            <button type="button" @click="isAddModalOpen = false" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Batal</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/25">Simpan Webhook</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Lihat Log -->
    <div
      v-if="isLogsModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isLogsModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Log Pengiriman Webhook Terakhir</h2>
        <div class="mt-4 divide-y divide-zinc-800">
          <div v-for="log in sampleLogs" :key="log.id" class="py-3 flex items-center justify-between text-xs">
            <div class="space-y-0.5">
              <span class="font-mono text-zinc-200 font-semibold">{{ log.event }}</span>
              <p class="text-[10px] text-zinc-500">{{ log.time }} &bull; Latency: {{ log.latency }}</p>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
              HTTP {{ log.status }} OK
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
