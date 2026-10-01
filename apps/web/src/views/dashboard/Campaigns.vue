<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  Radio,
  Plus,
  Play,
  Pause,
  XCircle,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-vue-next';

interface CampaignItem {
  id: string;
  name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  device: string;
  scheduledAt?: string;
  createdAt: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const campaigns = ref<CampaignItem[]>([
  {
    id: 'camp_01',
    name: 'Flash Sale Awal Bulan Oktober 2026',
    status: 'RUNNING',
    totalRecipients: 2500,
    sentCount: 1820,
    failedCount: 12,
    device: 'CS Toko Utama (QR)',
    createdAt: 'Hari ini, 10:00 WIB',
  },
  {
    id: 'camp_02',
    name: 'Pengingat Perpanjangan Langganan',
    status: 'COMPLETED',
    totalRecipients: 450,
    sentCount: 448,
    failedCount: 2,
    device: 'Official Meta Cloud API',
    createdAt: 'Kemarin, 14:00 WIB',
  },
  {
    id: 'camp_03',
    name: 'Broadcast Undangan Webinar CRM WhatsApp',
    status: 'SCHEDULED',
    totalRecipients: 1200,
    sentCount: 0,
    failedCount: 0,
    device: 'Official Meta Cloud API',
    scheduledAt: 'Besok, 09:00 WIB',
    createdAt: 'Hari ini, 11:30 WIB',
  },
]);

const isCreateModalOpen = ref(false);
const wizardStep = ref(1);

// Wizard form data
const formName = ref('');
const formDeviceId = ref('dev_mock_01');
const formTargetGroup = ref('Semua Pelanggan VIP');
const formContent = ref('{Halo|Hai|Selamat pagi} kak {{nama}}, khusus hari ini dapatkan diskon 30% dengan kode FLASH30!');
const formMinDelay = ref(5);
const formMaxDelay = ref(12);

function openCreateModal() {
  formName.value = '';
  wizardStep.value = 1;
  isCreateModalOpen.value = true;
}

async function handleLaunchCampaign() {
  notification.success(`Campaign "${formName.value}" berhasil dibuat dan diantrekan ke antrean BullMQ!`);
  campaigns.value.unshift({
    id: 'camp_' + Date.now(),
    name: formName.value,
    status: 'RUNNING',
    totalRecipients: 350,
    sentCount: 0,
    failedCount: 0,
    device: 'CS Toko Utama (QR)',
    createdAt: 'Baru saja',
  });
  isCreateModalOpen.value = false;
}

function handlePause(id: string) {
  const camp = campaigns.value.find((c) => c.id === id);
  if (camp) {
    camp.status = 'PAUSED';
    notification.info(`Broadcast "${camp.name}" dijeda sementara.`);
  }
}

function handleResume(id: string) {
  const camp = campaigns.value.find((c) => c.id === id);
  if (camp) {
    camp.status = 'RUNNING';
    notification.success(`Broadcast "${camp.name}" dilanjutkan.`);
  }
}

function handleCancel(id: string) {
  const camp = campaigns.value.find((c) => c.id === id);
  if (camp && confirm('Batalkan pengiriman sisa broadcast ini?')) {
    camp.status = 'CANCELLED';
    notification.warning(`Broadcast "${camp.name}" telah dibatalkan.`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Broadcast & Kampanye Pesan</h1>
        <p class="text-sm text-zinc-400 mt-1">Kirim pesan massal berjadwal dengan proteksi anti-banned cerdas dan pemantauan realtime.</p>
      </div>

      <button
        @click="openCreateModal"
        class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 self-start"
      >
        <Plus class="w-4 h-4" />
        <span>Buat Broadcast Baru</span>
      </button>
    </div>

    <!-- Campaigns List -->
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="camp in campaigns"
        :key="camp.id"
        class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <!-- Campaign Info -->
        <div class="space-y-2 flex-1">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-bold text-white">{{ camp.name }}</h3>
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
              :class="{
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': camp.status === 'COMPLETED',
                'bg-orange-500/10 text-orange-400 border border-orange-500/30 animate-pulse': camp.status === 'RUNNING',
                'bg-amber-500/10 text-amber-400 border border-amber-500/30': camp.status === 'PAUSED' || camp.status === 'SCHEDULED',
                'bg-zinc-800 text-zinc-400': camp.status === 'CANCELLED',
              }"
            >
              {{ camp.status }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <span>Device: <strong class="text-zinc-200">{{ camp.device }}</strong></span>
            <span>&bull;</span>
            <span>Target: <strong class="text-zinc-200">{{ camp.totalRecipients.toLocaleString('id-ID') }} Penerima</strong></span>
            <span>&bull;</span>
            <span>Dibuat: {{ camp.createdAt }}</span>
            <span v-if="camp.scheduledAt">&bull; Jadwal: <strong class="text-orange-400">{{ camp.scheduledAt }}</strong></span>
          </div>

          <!-- Progress Bar -->
          <div class="pt-2 max-w-md">
            <div class="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Progress Pengiriman: {{ Math.round((camp.sentCount / (camp.totalRecipients || 1)) * 100) }}%</span>
              <span class="text-zinc-300 font-mono">{{ camp.sentCount }} / {{ camp.totalRecipients }}</span>
            </div>
            <div class="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                class="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                :style="{ width: `${(camp.sentCount / (camp.totalRecipients || 1)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="camp.status === 'RUNNING'"
            @click="handlePause(camp.id)"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 flex items-center gap-1.5 transition-colors border border-amber-500/20"
          >
            <Pause class="w-3.5 h-3.5" /> Jeda
          </button>
          <button
            v-if="camp.status === 'PAUSED'"
            @click="handleResume(camp.id)"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1.5 transition-colors border border-emerald-500/30"
          >
            <Play class="w-3.5 h-3.5" /> Lanjutkan
          </button>
          <button
            v-if="camp.status === 'RUNNING' || camp.status === 'PAUSED'"
            @click="handleCancel(camp.id)"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center gap-1.5 transition-colors"
          >
            <XCircle class="w-3.5 h-3.5" /> Batalkan
          </button>
        </div>
      </div>
    </div>

    <!-- Wizard Modal Buat Broadcast -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button
          @click="isCreateModalOpen = false"
          class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Buat Broadcast Kampanye Baru</h2>
        <p class="text-xs text-zinc-400 mt-1">Langkah {{ wizardStep }} dari 3</p>

        <!-- Steps Progress Tracker -->
        <div class="flex items-center gap-2 my-5">
          <div class="flex-1 h-1.5 rounded-full" :class="wizardStep >= 1 ? 'bg-orange-500' : 'bg-zinc-800'"></div>
          <div class="flex-1 h-1.5 rounded-full" :class="wizardStep >= 2 ? 'bg-orange-500' : 'bg-zinc-800'"></div>
          <div class="flex-1 h-1.5 rounded-full" :class="wizardStep >= 3 ? 'bg-orange-500' : 'bg-zinc-800'"></div>
        </div>

        <!-- Step 1: Info & Device -->
        <div v-if="wizardStep === 1" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Nama Kampanye</label>
            <input
              v-model="formName"
              type="text"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              placeholder="Contoh: Promo Promo Gajian Oktober 2026"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Pilih Device WhatsApp Pengirim</label>
            <select
              v-model="formDeviceId"
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            >
              <option value="dev_mock_01">CS WhatsApp Utama (QR Mode) - +62 812-3456-7890</option>
              <option value="dev_mock_02">Official Meta Cloud API - +62 888-0000-1111</option>
            </select>
          </div>

          <div class="pt-4 flex justify-end">
            <button
              type="button"
              :disabled="!formName"
              @click="wizardStep = 2"
              class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Lanjut Pilih Kontak</span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Step 2: Recipients Selection -->
        <div v-else-if="wizardStep === 2" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Target Kontak / Grup Kontak</label>
            <select
              v-model="formTargetGroup"
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            >
              <option value="Semua Pelanggan VIP">Semua Pelanggan VIP (350 Kontak)</option>
              <option value="Member Prioritas">Member Prioritas (820 Kontak)</option>
              <option value="Tag: Calon Buyer">Tag: Calon Buyer (1,240 Kontak)</option>
            </select>
          </div>

          <!-- Anti Banned Settings -->
          <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <p class="text-xs font-bold text-orange-400 flex items-center gap-1.5">
              <Sparkles class="w-4 h-4" /> Pengaturan Proteksi Anti-Banned:
            </p>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-zinc-400 mb-1">Delay Minimal (detik)</label>
                <input
                  v-model.number="formMinDelay"
                  type="number"
                  min="3"
                  class="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-center"
                />
              </div>
              <div>
                <label class="block text-zinc-400 mb-1">Delay Maksimal (detik)</label>
                <input
                  v-model.number="formMaxDelay"
                  type="number"
                  min="5"
                  class="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-center"
                />
              </div>
            </div>
            <p class="text-[11px] text-zinc-500">Jeda acak antar pesan mencegah deteksi pola spam oleh sistem WhatsApp.</p>
          </div>

          <div class="pt-4 flex justify-between">
            <button
              type="button"
              @click="wizardStep = 1"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Kembali
            </button>
            <button
              type="button"
              @click="wizardStep = 3"
              class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5"
            >
              <span>Lanjut Tulis Pesan</span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Step 3: Message Composer -->
        <div v-else class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Teks Pesan Broadcast</label>
            <textarea
              v-model="formContent"
              rows="5"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 leading-relaxed"
            ></textarea>
            <p class="text-[11px] text-zinc-500 mt-1">
              Gunakan <code class="text-orange-400">&#123;halo|hai&#125;</code> untuk variasi kata dan <code class="text-orange-400">&#123;&#123;nama&#125;&#125;</code> untuk nama penerima.
            </p>
          </div>

          <div class="pt-4 flex justify-between">
            <button
              type="button"
              @click="wizardStep = 2"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Kembali
            </button>
            <button
              type="button"
              @click="handleLaunchCampaign"
              class="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2"
            >
              <Radio class="w-4 h-4" />
              <span>Luncurkan Broadcast Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
