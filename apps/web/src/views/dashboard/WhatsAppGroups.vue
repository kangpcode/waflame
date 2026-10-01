<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  Layers,
  Plus,
  Users,
  Link,
  ShieldCheck,
  UserPlus,
  Trash2,
  Copy,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-vue-next';

interface WaGroupItem {
  id: string;
  name: string;
  jid: string;
  memberCount: number;
  isAdmin: boolean;
  inviteLink?: string;
  createdAt: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const groups = ref<WaGroupItem[]>([
  {
    id: 'grp_01',
    name: 'Komunitas Pengusaha Muda Jakarta',
    jid: '1203630291827364@g.us',
    memberCount: 842,
    isAdmin: true,
    inviteLink: 'https://chat.whatsapp.com/B9xKlmnOpQrStUv',
    createdAt: '2026-08-10',
  },
  {
    id: 'grp_02',
    name: 'Buyer VIP Pre-Order Produk 2026',
    jid: '1203630987654321@g.us',
    memberCount: 310,
    isAdmin: true,
    inviteLink: 'https://chat.whatsapp.com/K8yAbcDeFgHiJkL',
    createdAt: '2026-09-01',
  },
  {
    id: 'grp_03',
    name: 'Alumni Workshop Digital Marketing',
    jid: '1203631122334455@g.us',
    memberCount: 156,
    isAdmin: false,
    createdAt: '2026-09-12',
  },
]);

const isInviteModalOpen = ref(false);
const selectedGroup = ref<WaGroupItem | null>(null);
const invitePhone = ref('');

function copyLink(link: string) {
  navigator.clipboard.writeText(link);
  notification.success('Tautan undangan grup disalin!');
}

function openInviteModal(group: WaGroupItem) {
  selectedGroup.value = group;
  invitePhone.value = '';
  isInviteModalOpen.value = true;
}

function handleInviteMember() {
  if (!invitePhone.value || !selectedGroup.value) return;
  notification.success(`Undangan berhasil dikirimkan ke nomor ${invitePhone.value} untuk bergabung ke ${selectedGroup.value.name}!`);
  isInviteModalOpen.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Manajemen WhatsApp Groups (QR Mode)</h1>
        <p class="text-sm text-zinc-400 mt-1">Otomasi grup WhatsApp: undang kontak massal, kelola tautan invite, dan pantau anggota.</p>
      </div>

      <button
        @click="notification.info('Fitur pembuatan grup baru siap digunakan!')"
        class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2 self-start"
      >
        <Plus class="w-4 h-4" />
        <span>Buat Grup WhatsApp Baru</span>
      </button>
    </div>

    <!-- Groups Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="grp in groups"
        :key="grp.id"
        class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              :class="grp.isAdmin ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-400'"
            >
              {{ grp.isAdmin ? 'Admin Grup' : 'Anggota' }}
            </span>
            <span class="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <Users class="w-3.5 h-3.5 text-zinc-500" /> {{ grp.memberCount }} Anggota
            </span>
          </div>

          <h3 class="font-bold text-base text-white leading-snug">{{ grp.name }}</h3>
          <p class="text-[10px] font-mono text-zinc-500 truncate mt-1">JID: {{ grp.jid }}</p>

          <!-- Invite Link Box -->
          <div v-if="grp.inviteLink" class="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
            <span class="text-xs text-zinc-400 font-mono truncate">{{ grp.inviteLink }}</span>
            <button
              @click="copyLink(grp.inviteLink)"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Salin Link"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <button
            @click="openInviteModal(grp)"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 flex items-center gap-1.5 transition-colors"
          >
            <UserPlus class="w-3.5 h-3.5" />
            <span>Undang Kontak</span>
          </button>
          <span class="text-[10px] text-zinc-500">Dibuat: {{ grp.createdAt }}</span>
        </div>
      </div>
    </div>

    <!-- Modal Undang Kontak -->
    <div
      v-if="isInviteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isInviteModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Undang Kontak ke Grup</h2>
        <p class="text-xs text-zinc-400 mt-1">Grup: {{ selectedGroup?.name }}</p>

        <form @submit.prevent="handleInviteMember" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Nomor WhatsApp Tujuan</label>
            <input
              v-model="invitePhone"
              type="text"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono placeholder-zinc-500"
              placeholder="+6281234567890"
            />
          </div>

          <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
            Sistem Baileys engine akan otomatis mengirim undangan resmi ke kontak dengan jeda keamanan.
          </div>

          <div class="pt-3 flex justify-end gap-3">
            <button type="button" @click="isInviteModalOpen = false" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Batal</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/25">Kirim Undangan</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
