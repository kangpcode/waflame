<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-vue-next';

interface TemplateItem {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  language: string;
  body: string;
  updatedAt: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const templates = ref<TemplateItem[]>([
  {
    id: 'tpl_01',
    name: 'order_status_update',
    category: 'UTILITY',
    status: 'APPROVED',
    language: 'id',
    body: 'Halo {{1}}, pesanan Anda dengan nomor resi {{2}} telah diserahkan ke kurir pengiriman.',
    updatedAt: '2 hari lalu',
  },
  {
    id: 'tpl_02',
    name: 'otp_verification_code',
    category: 'AUTHENTICATION',
    status: 'APPROVED',
    language: 'id',
    body: 'Kode verifikasi keamanan Waflame Anda adalah {{1}}. Jangan berikan kode ini kepada siapa pun.',
    updatedAt: '1 minggu lalu',
  },
  {
    id: 'tpl_03',
    name: 'promo_weekend_special',
    category: 'MARKETING',
    status: 'PENDING',
    language: 'id',
    body: 'Spesial akhir pekan! Dapatkan diskon hingga 50% untuk semua kategori produk hari ini.',
    updatedAt: 'Baru saja',
  },
]);

const isCreateModalOpen = ref(false);
const syncing = ref(false);

const formName = ref('');
const formCategory = ref<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('UTILITY');
const formBody = ref('Halo {{1}}, terima kasih atas kunjungan Anda.');

async function handleSync() {
  syncing.value = true;
  setTimeout(() => {
    syncing.value = false;
    notification.success('Template pesan berhasil disinkronisasi dari Meta Cloud API!');
  }, 1000);
}

function handleCreateTemplate() {
  templates.value.unshift({
    id: 'tpl_' + Date.now(),
    name: formName.value.toLowerCase().replace(/\s+/g, '_'),
    category: formCategory.value,
    status: 'PENDING',
    language: 'id',
    body: formBody.value,
    updatedAt: 'Baru saja',
  });
  notification.success('Template berhasil diajukan ke Meta untuk peninjauan!');
  isCreateModalOpen.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Template Pesan Meta WABA</h1>
        <p class="text-sm text-zinc-400 mt-1">Kelola template resmi Meta Cloud API untuk pesan di luar jendela 24 jam.</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="handleSync"
          :disabled="syncing"
          class="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': syncing }" />
          <span>Sync Meta</span>
        </button>

        <button
          @click="isCreateModalOpen = true"
          class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          <span>Buat Template Baru</span>
        </button>
      </div>
    </div>

    <!-- Templates Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-800 text-zinc-300">
              {{ tpl.category }}
            </span>

            <span
              class="flex items-center gap-1.5 text-xs font-semibold"
              :class="{
                'text-emerald-400': tpl.status === 'APPROVED',
                'text-amber-400': tpl.status === 'PENDING',
                'text-rose-400': tpl.status === 'REJECTED',
              }"
            >
              <CheckCircle2 v-if="tpl.status === 'APPROVED'" class="w-3.5 h-3.5" />
              <Clock v-else-if="tpl.status === 'PENDING'" class="w-3.5 h-3.5" />
              <AlertCircle v-else class="w-3.5 h-3.5" />
              {{ tpl.status }}
            </span>
          </div>

          <h3 class="font-bold text-base text-white font-mono leading-tight">{{ tpl.name }}</h3>
          <p class="text-[11px] text-zinc-500 mt-1">Bahasa: {{ tpl.language.toUpperCase() }}</p>

          <div class="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans">
            {{ tpl.body }}
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Diperbarui: {{ tpl.updatedAt }}</span>
          <router-link to="/dashboard/messages" class="text-orange-400 hover:text-orange-300 font-semibold">
            Gunakan &rarr;
          </router-link>
        </div>
      </div>
    </div>

    <!-- Modal Create Template -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button
          @click="isCreateModalOpen = false"
          class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Buat Template Meta WABA</h2>
        <p class="text-xs text-zinc-400 mt-1">Template akan diajukan ke Meta untuk proses approval otomatis.</p>

        <form @submit.prevent="handleCreateTemplate" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Nama Template (Huruf kecil & underscore)</label>
            <input
              v-model="formName"
              type="text"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              placeholder="promo_flash_sale"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Kategori Pesan</label>
            <select
              v-model="formCategory"
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            >
              <option value="UTILITY">UTILITY (Notifikasi pesanan, tagihan, akun)</option>
              <option value="MARKETING">MARKETING (Promosi, pengumuman diskon)</option>
              <option value="AUTHENTICATION">AUTHENTICATION (Kode OTP / 2FA)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Isi Pesan (Body Template)</label>
            <textarea
              v-model="formBody"
              rows="4"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 leading-relaxed"
              placeholder="Tulis template dengan variabel {{1}}, {{2}}..."
            ></textarea>
            <p class="text-[11px] text-zinc-500 mt-1">Gunakan format &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; untuk placeholder variabel dinamis.</p>
          </div>

          <div class="pt-3 flex justify-end gap-3">
            <button
              type="button"
              @click="isCreateModalOpen = false"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
            >
              Ajukan ke Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
