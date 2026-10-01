<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  Bot,
  Plus,
  Clock,
  Sparkles,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
} from 'lucide-vue-next';

interface AutoReplyRule {
  id: string;
  name: string;
  triggerType: 'EXACT' | 'CONTAINS' | 'REGEX' | 'WELCOME' | 'FALLBACK';
  keywords: string[];
  responseContent: string;
  priority: number;
  isActive: boolean;
  businessHoursOnly?: boolean;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const rules = ref<AutoReplyRule[]>([
  {
    id: 'ar_01',
    name: 'Info Jam Operasional Kantor',
    triggerType: 'CONTAINS',
    keywords: ['jam buka', 'operasional', 'jam kerja', 'buka jam'],
    responseContent: 'Halo kak! Layanan kantor kami buka setiap Senin - Jumat pukul 08:00 - 17:00 WIB. Pertanyaan Anda akan segera kami respon.',
    priority: 10,
    isActive: true,
  },
  {
    id: 'ar_02',
    name: 'Pesan Selamat Datang Pelanggan Baru',
    triggerType: 'WELCOME',
    keywords: ['welcome'],
    responseContent: 'Halo! Selamat datang di layanan resmi kami. Ketik "MENU" untuk melihat daftar layanan dan bantuan.',
    priority: 1,
    isActive: true,
  },
  {
    id: 'ar_03',
    name: 'Pusat Bantuan & Menu',
    triggerType: 'EXACT',
    keywords: ['menu', 'help', 'bantuan'],
    responseContent: 'Silakan pilih menu bantuan:\n1. Cek Status Pesanan\n2. Bicara dengan CS Manusia\n3. Info Harga Paket',
    priority: 5,
    isActive: true,
  },
]);

const isAddModalOpen = ref(false);
const formName = ref('');
const formTriggerType = ref<'EXACT' | 'CONTAINS' | 'REGEX' | 'WELCOME' | 'FALLBACK'>('CONTAINS');
const formKeywords = ref('');
const formResponse = ref('');
const formPriority = ref(10);
const formBusinessHoursOnly = ref(false);

function handleCreateRule() {
  if (!formName.value || !formResponse.value) {
    notification.warning('Nama aturan dan balasan pesan wajib diisi');
    return;
  }

  rules.value.unshift({
    id: 'ar_' + Date.now(),
    name: formName.value,
    triggerType: formTriggerType.value,
    keywords: formKeywords.value ? formKeywords.value.split(',').map((k) => k.trim()) : [],
    responseContent: formResponse.value,
    priority: formPriority.value,
    isActive: true,
    businessHoursOnly: formBusinessHoursOnly.value,
  });

  notification.success(`Aturan auto reply "${formName.value}" berhasil dibuat!`);
  isAddModalOpen.value = false;
  formName.value = '';
  formKeywords.value = '';
  formResponse.value = '';
}

function toggleActive(rule: AutoReplyRule) {
  rule.isActive = !rule.isActive;
  notification.info(`Status aturan diubah menjadi ${rule.isActive ? 'Aktif' : 'Nonaktif'}`);
}

function handleDeleteRule(id: string) {
  rules.value = rules.value.filter((r) => r.id !== id);
  notification.success('Aturan berhasil dihapus');
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Auto Reply & Chatbot Engine</h1>
        <p class="text-sm text-zinc-400 mt-1">Otomasi balasan WhatsApp 24/7 berdasarkan kata kunci cerdas dan jadwal jam kerja.</p>
      </div>

      <button
        @click="isAddModalOpen = true"
        class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2 self-start"
      >
        <Plus class="w-4 h-4" />
        <span>Tambah Aturan Baru</span>
      </button>
    </div>

    <!-- Rules List -->
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="rule in rules"
        :key="rule.id"
        class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
      >
        <div class="space-y-3 flex-1">
          <div class="flex items-center gap-3">
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
              :class="{
                'bg-orange-500/10 text-orange-400 border border-orange-500/30': rule.triggerType === 'CONTAINS',
                'bg-blue-500/10 text-blue-400 border border-blue-500/30': rule.triggerType === 'EXACT',
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': rule.triggerType === 'WELCOME',
                'bg-purple-500/10 text-purple-400 border border-purple-500/30': rule.triggerType === 'REGEX',
              }"
            >
              Trigger: {{ rule.triggerType }}
            </span>

            <span class="text-xs text-zinc-400 font-mono">Prioritas: {{ rule.priority }}</span>

            <span v-if="rule.businessHoursOnly" class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-semibold flex items-center gap-1">
              <Clock class="w-3 h-3" /> Jam Kerja Saja
            </span>
          </div>

          <h3 class="font-bold text-base text-white">{{ rule.name }}</h3>

          <!-- Keywords List -->
          <div v-if="rule.keywords.length" class="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
            <span class="text-zinc-500 text-[11px]">Kata Kunci:</span>
            <span
              v-for="kw in rule.keywords"
              :key="kw"
              class="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px]"
            >
              "{{ kw }}"
            </span>
          </div>

          <!-- Response text box -->
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed max-w-2xl whitespace-pre-line">
            {{ rule.responseContent }}
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-3 shrink-0">
          <button
            @click="toggleActive(rule)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            :class="rule.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'"
          >
            {{ rule.isActive ? 'Aktif' : 'Nonaktif' }}
          </button>

          <button
            @click="handleDeleteRule(rule.id)"
            class="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Aturan -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isAddModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Tambah Aturan Auto Reply</h2>
        <form @submit.prevent="handleCreateRule" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nama Aturan</label>
            <input v-model="formName" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="Contoh: Info Rekening Pembayaran" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Tipe Trigger</label>
              <select v-model="formTriggerType" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100">
                <option value="CONTAINS">CONTAINS (Mengandung kata)</option>
                <option value="EXACT">EXACT (Sama persis)</option>
                <option value="WELCOME">WELCOME (Pesan pertama kali)</option>
                <option value="REGEX">REGEX (Ekspresi pola)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Prioritas (1 - 100)</label>
              <input v-model.number="formPriority" type="number" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono text-center" />
            </div>
          </div>

          <div v-if="formTriggerType !== 'WELCOME'">
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Kata Kunci (Pisahkan dengan koma)</label>
            <input v-model="formKeywords" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="bca, rekening, transfer, bayar" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Pesan Balasan Otomatis</label>
            <textarea v-model="formResponse" rows="4" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 leading-relaxed" placeholder="Tulis balasan otomatis..."></textarea>
          </div>

          <div class="pt-3 flex justify-end gap-3">
            <button type="button" @click="isAddModalOpen = false" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Batal</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/25">Simpan Aturan</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
