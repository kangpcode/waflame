<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  MessageSquare,
  Search,
  Send,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Paperclip,
  Check,
  CheckCheck,
  Tag,
  Shield,
  Phone,
  Bookmark,
  ChevronDown,
  UserCheck,
} from 'lucide-vue-next';

interface Message {
  id: string;
  sender: 'CUSTOMER' | 'AGENT' | 'NOTE';
  authorName?: string;
  text: string;
  time: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
}

interface Conversation {
  id: string;
  contactName: string;
  phoneNumber: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  status: 'OPEN' | 'PENDING' | 'RESOLVED';
  assignedTo?: string;
  city?: string;
  tags?: string[];
  messages: Message[];
}

const auth = useAuthStore();
const notification = useNotificationStore();

const statusFilter = ref<'ALL' | 'OPEN' | 'PENDING' | 'RESOLVED'>('ALL');
const searchQuery = ref('');
const isInternalNoteMode = ref(false);
const messageInput = ref('');

const conversations = ref<Conversation[]>([
  {
    id: 'conv_1',
    contactName: 'Budi Santoso',
    phoneNumber: '+62 812-3456-7890',
    lastMessage: 'Halo kak, apakah produk varian flame red masih tersedia?',
    time: '14:28',
    unreadCount: 2,
    status: 'OPEN',
    assignedTo: 'Siti Rahma (CS)',
    city: 'Jakarta Selatan',
    tags: ['VIP', 'Hot Lead'],
    messages: [
      { id: 'm1', sender: 'CUSTOMER', text: 'Halo selamat siang admin Waflame.', time: '14:20' },
      { id: 'm2', sender: 'AGENT', authorName: 'Siti Rahma', text: 'Halo kak Budi, selamat siang! Ada yang bisa kami bantu?', time: '14:22', status: 'READ' },
      { id: 'm3', sender: 'CUSTOMER', text: 'Halo kak, apakah produk varian flame red masih tersedia?', time: '14:28' },
      { id: 'm4', sender: 'NOTE', authorName: 'Siti Rahma', text: 'Stok gudang sisa 3 pcs, berikan promo khusus jika deal hari ini.', time: '14:29' },
    ],
  },
  {
    id: 'conv_2',
    contactName: 'PT Maju Bersama (Finance)',
    phoneNumber: '+62 888-1122-3344',
    lastMessage: 'Invoice tagihan langganan telah kami terima, terima kasih!',
    time: '12:15',
    unreadCount: 0,
    status: 'RESOLVED',
    assignedTo: 'Super Administrator',
    city: 'Surabaya',
    tags: ['Enterprise'],
    messages: [
      { id: 'm21', sender: 'AGENT', authorName: 'System', text: 'Halo, berikut invoice nomor #INV-2026-09 untuk periode September.', time: '12:10', status: 'READ' },
      { id: 'm22', sender: 'CUSTOMER', text: 'Invoice tagihan langganan telah kami terima, terima kasih!', time: '12:15' },
    ],
  },
  {
    id: 'conv_3',
    contactName: 'Dewi Anggraeni',
    phoneNumber: '+62 877-3344-5566',
    lastMessage: 'Bisa minta nomor resi pengiriman kemarin?',
    time: '10:40',
    unreadCount: 1,
    status: 'PENDING',
    city: 'Bandung',
    tags: ['Regular'],
    messages: [
      { id: 'm31', sender: 'CUSTOMER', text: 'Bisa minta nomor resi pengiriman kemarin?', time: '10:40' },
    ],
  },
]);

const activeConversation = ref<Conversation>(conversations.value[0]);

const filteredConversations = computed(() => {
  return conversations.value.filter((c) => {
    if (statusFilter.value !== 'ALL' && c.status !== statusFilter.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      return c.contactName.toLowerCase().includes(q) || c.phoneNumber.includes(q);
    }
    return true;
  });
});

function selectConversation(conv: Conversation) {
  activeConversation.value = conv;
  conv.unreadCount = 0;
}

function handleSendMessage() {
  if (!messageInput.value.trim() || !activeConversation.value) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (isInternalNoteMode.value) {
    activeConversation.value.messages.push({
      id: 'm_' + Date.now(),
      sender: 'NOTE',
      authorName: auth.user?.name || 'Agen CS',
      text: messageInput.value,
      time: timeStr,
    });
    notification.success('Catatan internal tim berhasil disimpan!');
  } else {
    activeConversation.value.messages.push({
      id: 'm_' + Date.now(),
      sender: 'AGENT',
      authorName: auth.user?.name || 'Agen CS',
      text: messageInput.value,
      time: timeStr,
      status: 'SENT',
    });
    activeConversation.value.lastMessage = messageInput.value;
    notification.success('Balasan pesan dikirim ke WhatsApp pelanggan!');
  }

  messageInput.value = '';
}

function changeConversationStatus(newStatus: 'OPEN' | 'PENDING' | 'RESOLVED') {
  if (activeConversation.value) {
    activeConversation.value.status = newStatus;
    notification.info(`Status percakapan diubah menjadi ${newStatus}`);
  }
}

function assignToMe() {
  if (activeConversation.value) {
    activeConversation.value.assignedTo = auth.user?.name || 'Administrator';
    notification.success(`Percakapan ditugaskan kepada ${activeConversation.value.assignedTo}`);
  }
}
</script>

<template>
  <div class="h-[calc(100vh-8.5rem)] rounded-3xl bg-[#121215] border border-zinc-800/80 overflow-hidden flex shadow-2xl">
    <!-- Left Pane: Conversations List -->
    <div class="w-80 md:w-96 border-r border-zinc-800 flex flex-col bg-[#121215] shrink-0">
      <!-- Top Search & Status Tabs -->
      <div class="p-4 border-b border-zinc-800 space-y-3">
        <div class="relative">
          <Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            class="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            placeholder="Cari percakapan..."
          />
        </div>

        <div class="grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-semibold text-center">
          <button
            @click="statusFilter = 'ALL'"
            class="py-1 rounded-lg transition-all"
            :class="statusFilter === 'ALL' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Semua
          </button>
          <button
            @click="statusFilter = 'OPEN'"
            class="py-1 rounded-lg transition-all"
            :class="statusFilter === 'OPEN' ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Open
          </button>
          <button
            @click="statusFilter = 'PENDING'"
            class="py-1 rounded-lg transition-all"
            :class="statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Pending
          </button>
          <button
            @click="statusFilter = 'RESOLVED'"
            class="py-1 rounded-lg transition-all"
            :class="statusFilter === 'RESOLVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Selesai
          </button>
        </div>
      </div>

      <!-- Conversations List Container -->
      <div class="flex-1 overflow-y-auto divide-y divide-zinc-800/40 custom-scrollbar">
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          @click="selectConversation(conv)"
          class="p-4 hover:bg-zinc-800/40 cursor-pointer transition-colors flex items-start gap-3 relative"
          :class="activeConversation?.id === conv.id ? 'bg-orange-500/10 border-l-4 border-orange-500' : ''"
        >
          <div class="w-10 h-10 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-sm shrink-0 border border-zinc-700">
            {{ conv.contactName.charAt(0) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-xs text-white truncate">{{ conv.contactName }}</h4>
              <span class="text-[10px] text-zinc-500 font-mono">{{ conv.time }}</span>
            </div>

            <p class="text-[11px] text-zinc-400 truncate mt-1 leading-snug">{{ conv.lastMessage }}</p>

            <div class="mt-2 flex items-center justify-between">
              <span
                class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                :class="{
                  'bg-orange-500/20 text-orange-400': conv.status === 'OPEN',
                  'bg-amber-500/20 text-amber-400': conv.status === 'PENDING',
                  'bg-emerald-500/20 text-emerald-400': conv.status === 'RESOLVED',
                }"
              >
                {{ conv.status }}
              </span>

              <span
                v-if="conv.unreadCount > 0"
                class="w-4 h-4 rounded-full bg-orange-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0"
              >
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Center Pane: Chat Canvas -->
    <div class="flex-1 flex flex-col bg-[#09090b]">
      <!-- Chat Header -->
      <div class="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-[#121215]/80 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-sm border border-orange-500/30">
            {{ activeConversation?.contactName.charAt(0) }}
          </div>
          <div>
            <h3 class="font-bold text-sm text-white">{{ activeConversation?.contactName }}</h3>
            <p class="text-[11px] text-zinc-400 font-mono">{{ activeConversation?.phoneNumber }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-xs text-zinc-400">
            <span class="text-zinc-500">CS:</span>
            <span class="text-zinc-200 font-semibold">{{ activeConversation?.assignedTo || 'Belum Ditugaskan' }}</span>
          </div>

          <button
            @click="assignToMe"
            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
          >
            Tugaskan ke Saya
          </button>
        </div>
      </div>

      <!-- Messages Thread Scrollable Canvas -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-pattern">
        <div
          v-for="msg in activeConversation?.messages"
          :key="msg.id"
          class="flex flex-col"
          :class="{
            'items-end': msg.sender === 'AGENT',
            'items-start': msg.sender === 'CUSTOMER',
            'items-center': msg.sender === 'NOTE',
          }"
        >
          <!-- Customer Bubble -->
          <div
            v-if="msg.sender === 'CUSTOMER'"
            class="max-w-md rounded-2xl rounded-tl-none bg-zinc-800/90 text-zinc-100 p-3.5 shadow-md border border-zinc-700/60 text-xs"
          >
            <p class="leading-relaxed whitespace-pre-wrap">{{ msg.text }}</p>
            <span class="block text-right text-[9px] text-zinc-400 mt-1 font-mono">{{ msg.time }}</span>
          </div>

          <!-- Agent Outbound Bubble -->
          <div
            v-else-if="msg.sender === 'AGENT'"
            class="max-w-md rounded-2xl rounded-tr-none bg-gradient-to-r from-orange-600 to-orange-500 text-white p-3.5 shadow-md text-xs space-y-1"
          >
            <p v-if="msg.authorName" class="text-[10px] text-orange-200 font-semibold mb-0.5">{{ msg.authorName }}</p>
            <p class="leading-relaxed whitespace-pre-wrap">{{ msg.text }}</p>
            <div class="flex items-center justify-end gap-1 text-[9px] text-orange-200 font-mono mt-1">
              <span>{{ msg.time }}</span>
              <CheckCheck class="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <!-- Internal Private Note (Yellow/Amber) -->
          <div
            v-else
            class="w-full max-w-lg p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs my-1"
          >
            <div class="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              <span class="flex items-center gap-1.5"><Bookmark class="w-3.5 h-3.5" /> CATATAN INTERNAL TIM</span>
              <span>{{ msg.authorName }} &bull; {{ msg.time }}</span>
            </div>
            <p class="text-zinc-200">{{ msg.text }}</p>
          </div>
        </div>
      </div>

      <!-- Bottom Chat Composer -->
      <div class="p-4 border-t border-zinc-800 bg-[#121215]">
        <!-- Internal Note Mode Switcher -->
        <div class="flex items-center justify-between mb-2 px-1">
          <div class="flex items-center gap-2">
            <button
              @click="isInternalNoteMode = false"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              :class="!isInternalNoteMode ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'"
            >
              Balas ke WhatsApp
            </button>
            <button
              @click="isInternalNoteMode = true"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              :class="isInternalNoteMode ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'"
            >
              <Bookmark class="w-3 h-3" />
              Catatan Internal (Private)
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="changeConversationStatus('RESOLVED')"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
            >
              Tandai Selesai
            </button>
          </div>
        </div>

        <form @submit.prevent="handleSendMessage" class="flex items-center gap-3">
          <div class="relative flex-1">
            <input
              v-model="messageInput"
              type="text"
              :placeholder="isInternalNoteMode ? 'Tulis catatan rahasia internal tim...' : 'Ketik pesan balasan WhatsApp...'"
              class="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            class="px-5 py-3 rounded-2xl font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2"
            :class="isInternalNoteMode ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'"
          >
            <span>{{ isInternalNoteMode ? 'Simpan Catatan' : 'Kirim' }}</span>
            <Send class="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>

    <!-- Right Pane: Customer Metadata Details -->
    <div class="w-72 border-l border-zinc-800 bg-[#121215] p-6 hidden lg:flex flex-col justify-between shrink-0">
      <div>
        <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Profil Pelanggan</h4>

        <div class="text-center py-4 border-b border-zinc-800">
          <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-xl mb-3">
            {{ activeConversation?.contactName.charAt(0) }}
          </div>
          <h3 class="font-bold text-base text-white">{{ activeConversation?.contactName }}</h3>
          <p class="text-xs text-zinc-400 font-mono mt-0.5">{{ activeConversation?.phoneNumber }}</p>
        </div>

        <div class="py-4 space-y-3 text-xs border-b border-zinc-800">
          <div class="flex justify-between">
            <span class="text-zinc-500">Domisili:</span>
            <span class="text-zinc-200 font-semibold">{{ activeConversation?.city || 'Jakarta' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Status Tiket:</span>
            <span class="font-bold text-orange-400">{{ activeConversation?.status }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Agen Ditugaskan:</span>
            <span class="text-zinc-200 font-semibold">{{ activeConversation?.assignedTo || 'Unassigned' }}</span>
          </div>
        </div>

        <div class="py-4 space-y-2">
          <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Tag Kontak:</span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="t in activeConversation?.tags"
              :key="t"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700"
            >
              {{ t }}
            </span>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-zinc-800">
        <router-link
          to="/dashboard/messages"
          class="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center gap-2 transition-colors"
        >
          <span>Kirim Broadcast Pribadi</span>
        </router-link>
      </div>
    </div>
  </div>
</template>
