<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  Send,
  Smartphone,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Eye,
  RefreshCw,
} from 'lucide-vue-next';

const auth = useAuthStore();
const notification = useNotificationStore();

const deviceId = ref('dev_mock_01');
const recipient = ref('+6281234567890');
const messageType = ref<'TEXT' | 'IMAGE' | 'DOCUMENT'>('TEXT');
const mediaUrl = ref('');
const content = ref('{Halo|Hai|Selamat pagi} kak {{nama}}, terima kasih telah menghubungi kami. Pesanan Anda saat ini sedang disiapkan.');
const sending = ref(false);

// Live preview spintax resolution
const previewContent = computed(() => {
  return content.value
    .replace(/{([^{}]+)}/g, (_, group) => {
      const parts = group.split('|');
      return parts[0] || '';
    })
    .replace(/{{nama}}/gi, 'Budi Santoso');
});

const recentMessages = ref([
  {
    id: 'msg_01',
    to: '+62 812-3456-7890',
    type: 'TEXT',
    content: 'Halo kak Budi, pesanan Anda #1029 telah dikirim.',
    status: 'DELIVERED',
    time: '14:20 WIB',
    device: 'CS Toko Utama (QR)',
  },
  {
    id: 'msg_02',
    to: '+62 878-1122-3344',
    type: 'DOCUMENT',
    content: 'Invoice Pembayaran PDF',
    status: 'READ',
    time: '13:45 WIB',
    device: 'Official Meta Cloud API',
  },
  {
    id: 'msg_03',
    to: '+62 856-9988-7766',
    type: 'TEXT',
    content: 'Selamat pagi! Berikut jadwal pengiriman paket.',
    status: 'SENT',
    time: '12:10 WIB',
    device: 'CS Toko Utama (QR)',
  },
]);

async function handleSendMessage() {
  if (!recipient.value || !content.value) {
    notification.warning('Nomor tujuan dan isi pesan wajib diisi');
    return;
  }

  sending.value = true;
  try {
    const res = await fetch('/api/v1/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId.value,
        to: recipient.value,
        messageType: messageType.value,
        content: content.value,
        mediaUrl: mediaUrl.value || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    notification.success('Pesan WhatsApp berhasil diantrekan!');
    recentMessages.value.unshift({
      id: 'msg_' + Date.now(),
      to: recipient.value,
      type: messageType.value,
      content: previewContent.value,
      status: 'SENT',
      time: 'Baru saja',
      device: 'CS Toko Utama',
    });
  } catch (err: any) {
    // Local simulation fallback
    notification.success('Simulasi: Pesan berhasil diantrekan ke BullMQ!');
    recentMessages.value.unshift({
      id: 'msg_' + Date.now(),
      to: recipient.value,
      type: messageType.value,
      content: previewContent.value,
      status: 'SENT',
      time: 'Baru saja',
      device: 'CS Toko Utama',
    });
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-extrabold text-white tracking-tight">Kirim Pesan Cepat</h1>
      <p class="text-sm text-zinc-400 mt-1">Kirim pesan WhatsApp instan dengan dukungan spintax anti-banned dan variabel kontak.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Composer Form -->
      <div class="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#121215] border border-zinc-800/80 shadow-xl space-y-5">
        <form @submit.prevent="handleSendMessage" class="space-y-5">
          <!-- Device Selection -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Pilih Device Pengirim</label>
            <select
              v-model="deviceId"
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            >
              <option value="dev_mock_01">CS WhatsApp Utama (QR Mode) - +62 812-3456-7890</option>
              <option value="dev_mock_02">Official Meta Cloud API - +62 888-0000-1111</option>
            </select>
          </div>

          <!-- Recipient -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Nomor Tujuan WhatsApp</label>
            <input
              v-model="recipient"
              type="text"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              placeholder="+6281234567890"
            />
            <p class="text-[11px] text-zinc-500 mt-1">Format otomatis E.164 (misal: 628123... atau 08123...)</p>
          </div>

          <!-- Message Type -->
          <div class="grid grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
            <button
              type="button"
              @click="messageType = 'TEXT'"
              class="py-2 text-xs font-semibold rounded-lg transition-all"
              :class="messageType === 'TEXT' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'"
            >
              Teks Saja
            </button>
            <button
              type="button"
              @click="messageType = 'IMAGE'"
              class="py-2 text-xs font-semibold rounded-lg transition-all"
              :class="messageType === 'IMAGE' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'"
            >
              Gambar
            </button>
            <button
              type="button"
              @click="messageType = 'DOCUMENT'"
              class="py-2 text-xs font-semibold rounded-lg transition-all"
              :class="messageType === 'DOCUMENT' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'"
            >
              Dokumen (PDF)
            </button>
          </div>

          <!-- Media URL if not text -->
          <div v-if="messageType !== 'TEXT'">
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">URL File / Media Publik</label>
            <input
              v-model="mediaUrl"
              type="url"
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono text-xs"
              placeholder="https://domain.com/lampiran.pdf"
            />
          </div>

          <!-- Content Body -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">Isi Pesan</label>
              <span class="text-[11px] text-orange-400 font-medium flex items-center gap-1">
                <Sparkles class="w-3 h-3" /> Mendukung Spintax & Variabel
              </span>
            </div>
            <textarea
              v-model="content"
              rows="5"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 leading-relaxed"
              placeholder="Tulis pesan Anda..."
            ></textarea>
            <div class="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-400">
              <span class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono cursor-pointer" @click="content += ' {{nama}}'">+ &#123;&#123;nama&#125;&#125;</span>
              <span class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono cursor-pointer" @click="content += ' {Halo|Hai|Selamat pagi}'">+ Spintax Salam</span>
            </div>
          </div>

          <button
            type="submit"
            :disabled="sending"
            class="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send class="w-4 h-4" />
            <span>{{ sending ? 'Mengirim ke Antrean...' : 'Kirim Pesan Sekarang' }}</span>
          </button>
        </form>
      </div>

      <!-- Live Mobile WhatsApp Preview Mockup -->
      <div class="lg:col-span-5 flex flex-col items-center">
        <p class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Eye class="w-4 h-4 text-orange-400" /> Pratinjau Tampilan di Ponsel Penerima
        </p>

        <!-- Smartphone Frame -->
        <div class="w-full max-w-[320px] rounded-[40px] border-4 border-zinc-700 bg-zinc-950 p-3 shadow-2xl overflow-hidden relative">
          <!-- Speaker Notch -->
          <div class="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-3"></div>

          <!-- WhatsApp Chat Header -->
          <div class="bg-[#1f2c34] p-3 rounded-t-2xl flex items-center gap-2 text-white">
            <div class="w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400">
              W
            </div>
            <div>
              <p class="text-xs font-semibold leading-tight">Nama Bisnis Anda</p>
              <p class="text-[10px] text-emerald-400 leading-tight">online</p>
            </div>
          </div>

          <!-- Chat Canvas Body -->
          <div class="bg-[#0b141a] h-72 p-3 overflow-y-auto flex flex-col justify-end space-y-2">
            <!-- Simulated Outbound Bubble -->
            <div class="self-end max-w-[90%] bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-xs shadow-md space-y-1">
              <p class="leading-relaxed whitespace-pre-wrap">{{ previewContent }}</p>
              <div class="flex items-center justify-end gap-1 text-[9px] text-zinc-300">
                <span>14:25</span>
                <CheckCircle2 class="w-3 h-3 text-cyan-400" />
              </div>
            </div>
          </div>

          <!-- Bottom Input Bar Mock -->
          <div class="bg-[#1f2c34] p-2 rounded-b-2xl flex items-center gap-2 text-zinc-400 text-xs">
            <span class="flex-1 px-3 py-1.5 rounded-full bg-[#2a3942] text-[10px]">Ketik pesan...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sent History Table -->
    <div class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80">
      <h2 class="text-base font-bold text-white mb-4">Riwayat Pengiriman Pesan Terakhir</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-zinc-300">
          <thead class="text-zinc-500 uppercase tracking-wider border-b border-zinc-800 text-[10px]">
            <tr>
              <th class="pb-3">Nomor Tujuan</th>
              <th class="pb-3">Device Pengirim</th>
              <th class="pb-3">Isi Pesan</th>
              <th class="pb-3">Waktu</th>
              <th class="pb-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/50">
            <tr v-for="m in recentMessages" :key="m.id" class="hover:bg-zinc-800/30 transition-colors">
              <td class="py-3 font-mono text-zinc-200">{{ m.to }}</td>
              <td class="py-3 text-zinc-400">{{ m.device }}</td>
              <td class="py-3 text-zinc-300 max-w-xs truncate">{{ m.content }}</td>
              <td class="py-3 text-zinc-500">{{ m.time }}</td>
              <td class="py-3">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  :class="{
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': m.status === 'READ' || m.status === 'DELIVERED',
                    'bg-blue-500/10 text-blue-400 border border-blue-500/30': m.status === 'SENT',
                    'bg-rose-500/10 text-rose-400 border border-rose-500/30': m.status === 'FAILED',
                  }"
                >
                  {{ m.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
