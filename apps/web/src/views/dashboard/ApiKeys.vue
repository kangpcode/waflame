<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  X,
  Check,
} from 'lucide-vue-next';

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  rateLimitPerMinute: number;
  permissions: string[];
  lastUsedAt?: string;
  createdAt: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const apiKeys = ref<ApiKeyItem[]>([
  {
    id: 'key_01',
    name: 'Integrasi Website Toko Online (Checkout OTP)',
    prefix: 'wf_live_caafc5',
    rateLimitPerMinute: 60,
    permissions: ['messages:send', 'devices:read'],
    lastUsedAt: 'Baru saja',
    createdAt: '2026-09-20',
  },
  {
    id: 'key_02',
    name: 'Zapier Production Key',
    prefix: 'wf_live_9a8b7c',
    rateLimitPerMinute: 120,
    permissions: ['messages:send', 'contacts:read'],
    lastUsedAt: '1 hari lalu',
    createdAt: '2026-09-25',
  },
]);

const isAddModalOpen = ref(false);
const isSecretModalOpen = ref(false);
const newlyCreatedKey = ref('');

const formName = ref('');
const formRateLimit = ref(60);
const formPermissions = ref<string[]>(['messages:send', 'devices:read', 'contacts:read']);

function handleCreateApiKey() {
  if (!formName.value) {
    notification.warning('Nama API Key wajib diisi');
    return;
  }

  const rawKey = 'wf_live_' + Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  newlyCreatedKey.value = rawKey;

  apiKeys.value.unshift({
    id: 'key_' + Date.now(),
    name: formName.value,
    prefix: rawKey.substring(0, 14),
    rateLimitPerMinute: formRateLimit.value,
    permissions: [...formPermissions.value],
    lastUsedAt: 'Belum pernah',
    createdAt: new Date().toISOString().split('T')[0],
  });

  isAddModalOpen.value = false;
  isSecretModalOpen.value = true;
  formName.value = '';
}

function copySecretKey() {
  navigator.clipboard.writeText(newlyCreatedKey.value);
  notification.success('API Key berhasil disalin ke clipboard!');
}

function handleDeleteKey(id: string) {
  apiKeys.value = apiKeys.value.filter((k) => k.id !== id);
  notification.success('API Key berhasil dicabut (revoked)');
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">REST API Keys & Kunci Akses</h1>
        <p class="text-sm text-zinc-400 mt-1">Kelola kunci API terenkripsi untuk integrasi sistem backend dengan sliding window rate limit.</p>
      </div>

      <div class="flex items-center gap-3">
        <router-link
          to="/docs"
          class="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
        >
          Lihat Dokumentasi API &rarr;
        </router-link>

        <button
          @click="isAddModalOpen = true"
          class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          <span>Buat API Key Baru</span>
        </button>
      </div>
    </div>

    <!-- API Keys List -->
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="k in apiKeys"
        :key="k.id"
        class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="space-y-2 flex-1">
          <div class="flex items-center gap-3">
            <h3 class="font-bold text-base text-white">{{ k.name }}</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              AKTIF
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
              {{ k.prefix }}••••••••••••••••••••••••••••••••
            </span>
            <span class="text-xs text-zinc-500">Rate Limit: <strong class="text-orange-400">{{ k.rateLimitPerMinute }} req/menit</strong></span>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-zinc-400">
            <span class="text-zinc-500 text-[11px]">Izin:</span>
            <span
              v-for="p in k.permissions"
              :key="p"
              class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]"
            >
              {{ p }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4 text-xs text-zinc-400">
          <span>Terakhir Digunakan: <strong class="text-zinc-200">{{ k.lastUsedAt || 'Belum' }}</strong></span>
          <button
            @click="handleDeleteKey(k.id)"
            class="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Cabut Kunci"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Kunci -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isAddModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Buat API Key Baru</h2>
        <form @submit.prevent="handleCreateApiKey" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nama Kunci (Identifikasi)</label>
            <input v-model="formName" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="Production CRM Backend" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Batas Permintaan (Rate Limit per Menit)</label>
            <input v-model.number="formRateLimit" type="number" min="10" max="600" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono" />
          </div>

          <div class="pt-3 flex justify-end gap-3">
            <button type="button" @click="isAddModalOpen = false" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Batal</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/25">Generate API Key</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Raw Secret Key Revealed Once -->
    <div
      v-if="isSecretModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-orange-500/40 shadow-2xl p-6 sm:p-8 relative">
        <div class="flex items-center gap-3 text-orange-400 mb-2">
          <KeyRound class="w-6 h-6" />
          <h2 class="text-xl font-extrabold text-white">Simpan API Key Anda Sekarang</h2>
        </div>

        <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 mb-4 flex items-start gap-2.5">
          <AlertTriangle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>Kunci ini hanya ditampilkan satu kali saja demi keamanan. Database kami hanya menyimpan hash SHA-256.</span>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 break-all font-mono text-xs text-emerald-400 flex items-center justify-between gap-3">
          <span>{{ newlyCreatedKey }}</span>
          <button
            @click="copySecretKey"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 shrink-0"
          >
            <Copy class="w-3.5 h-3.5" />
            <span>Salin</span>
          </button>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            @click="isSecretModalOpen = false"
            class="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white"
          >
            Saya Sudah Menyimpannya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
