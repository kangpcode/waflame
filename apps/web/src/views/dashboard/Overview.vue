<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import {
  Smartphone,
  Radio,
  Send,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();

const metrics = ref({
  totalSent: 14250,
  deliveredRate: '98.7%',
  activeDevices: 2,
  quotaUsed: 14250,
  quotaLimit: 50000,
  openConversations: 12,
});

const recentActivities = ref([
  { id: 1, type: 'campaign', text: 'Broadcast "Promo Gajian Super September" selesai dikirim ke 1,250 kontak.', time: '12 menit yang lalu', status: 'success' },
  { id: 2, type: 'device', text: 'Device "CS Toko Pusat (QR Mode)" terhubung kembali.', time: '45 menit yang lalu', status: 'success' },
  { id: 3, type: 'message', text: 'Pesan single terkirim ke +6281234567890 via Official Cloud API.', time: '1 jam yang lalu', status: 'info' },
  { id: 4, type: 'autoreply', text: 'Auto reply "Info Jam Operasional" merespon pesan otomatis.', time: '2 jam yang lalu', status: 'info' },
]);

const dailyStats = [
  { day: 'Sen', sent: 1200, height: '45%' },
  { day: 'Sel', sent: 1850, height: '65%' },
  { day: 'Rab', sent: 2400, height: '85%' },
  { day: 'Kam', sent: 2100, height: '75%' },
  { day: 'Jum', sent: 3100, height: '100%' },
  { day: 'Sab', sent: 1900, height: '68%' },
  { day: 'Min', sent: 1700, height: '60%' },
];

onMounted(async () => {
  if (auth.token) {
    try {
      const res = await fetch('/api/v1/devices', {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        metrics.value.activeDevices = data.data.filter((d: any) => d.status === 'CONNECTED').length || 1;
      }
    } catch {
      // Fallback to sample values
    }
  }
});
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Header Banner -->
    <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-950/60 via-zinc-900/80 to-zinc-900/60 border border-orange-500/20 relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-semibold mb-3">
            <Sparkles class="w-3.5 h-3.5" /> Workspace Aktif: {{ auth.user?.tenantName || 'PT Maju Bersama' }}
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Selamat Datang, {{ auth.user?.name || 'Administrator' }}! 👋
          </h1>
          <p class="text-zinc-400 text-sm mt-1 max-w-xl">
            Dual connection engine Anda beroperasi normal. Pantau kinerja pengiriman pesan dan interaksi pelanggan secara real-time.
          </p>
        </div>

        <!-- Quick Launch Actions -->
        <div class="flex items-center gap-3 shrink-0">
          <router-link
            to="/dashboard/messages"
            class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2"
          >
            <Send class="w-4 h-4" />
            <span>Kirim Cepat</span>
          </router-link>

          <router-link
            to="/dashboard/campaigns"
            class="px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors flex items-center gap-2"
          >
            <Radio class="w-4 h-4 text-orange-400" />
            <span>Buat Broadcast</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Stat Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Total Messages -->
      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80 hover:border-orange-500/30 transition-all">
        <div class="flex items-center justify-between text-zinc-400 mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Pesan Bulan Ini</span>
          <div class="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Send class="w-4 h-4" />
          </div>
        </div>
        <p class="text-2xl font-extrabold text-white">{{ metrics.totalSent.toLocaleString('id-ID') }}</p>
        <div class="mt-2 flex items-center gap-2 text-xs text-emerald-400">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>+14.2% dari bulan lalu</span>
        </div>
      </div>

      <!-- Delivery Rate -->
      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80 hover:border-orange-500/30 transition-all">
        <div class="flex items-center justify-between text-zinc-400 mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider">Rasio Terkirim (Delivery)</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <p class="text-2xl font-extrabold text-white">{{ metrics.deliveredRate }}</p>
        <p class="mt-2 text-xs text-zinc-400">Gagal / Ditolak: 1.3%</p>
      </div>

      <!-- Active Devices -->
      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80 hover:border-orange-500/30 transition-all">
        <div class="flex items-center justify-between text-zinc-400 mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider">Device WhatsApp Aktif</span>
          <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Smartphone class="w-4 h-4" />
          </div>
        </div>
        <p class="text-2xl font-extrabold text-white">{{ metrics.activeDevices }} Nomor</p>
        <p class="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Semua sesi terkoneksi
        </p>
      </div>

      <!-- Quota Usage -->
      <div class="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80 hover:border-orange-500/30 transition-all">
        <div class="flex items-center justify-between text-zinc-400 mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider">Penggunaan Kuota Pesan</span>
          <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Radio class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-xl font-extrabold text-white">{{ (metrics.quotaUsed / 1000).toFixed(1) }}k</span>
          <span class="text-xs text-zinc-400">dari {{ (metrics.quotaLimit / 1000).toFixed(0) }}k kuota</span>
        </div>
        <!-- Progress Bar -->
        <div class="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
          <div
            class="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
            :style="{ width: `${(metrics.quotaUsed / metrics.quotaLimit) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Charts & Activity Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Traffic Analytics Chart Box -->
      <div class="lg:col-span-8 p-6 rounded-3xl bg-[#121215] border border-zinc-800/80">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-base font-bold text-white">Aktivitas Pengiriman Pesan (7 Hari Terakhir)</h2>
            <p class="text-xs text-zinc-400 mt-0.5">Statistik volume pesan terkirim harian</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
            Minggu Ini
          </span>
        </div>

        <!-- Custom SVG / CSS Bar Chart -->
        <div class="h-64 flex items-end justify-between gap-4 pt-8 px-2 border-b border-zinc-800 pb-4">
          <div
            v-for="(item, idx) in dailyStats"
            :key="idx"
            class="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
          >
            <!-- Hover Tooltip -->
            <span class="text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {{ item.sent.toLocaleString('id-ID') }}
            </span>
            <!-- Bar -->
            <div
              class="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-orange-600/40 via-orange-500 to-amber-400 hover:brightness-125 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
              :style="{ height: item.height }"
            ></div>
            <!-- Day Label -->
            <span class="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">
              {{ item.day }}
            </span>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-orange-500"></span> Official & QR Sent
            </span>
          </div>
          <span>Puncak pengiriman: Jumat (3,100 pesan)</span>
        </div>
      </div>

      <!-- Recent System Events -->
      <div class="lg:col-span-4 p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-white">Log Aktivitas Terbaru</h2>
            <router-link to="/dashboard/audit-logs" class="text-xs text-orange-400 hover:text-orange-300">
              Lihat Semua
            </router-link>
          </div>

          <div class="space-y-4">
            <div
              v-for="act in recentActivities"
              :key="act.id"
              class="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs"
            >
              <div
                class="w-2 h-2 rounded-full mt-1.5 shrink-0"
                :class="{
                  'bg-emerald-400': act.status === 'success',
                  'bg-orange-400': act.status === 'info',
                  'bg-rose-400': act.status === 'error',
                }"
              ></div>
              <div class="flex-1">
                <p class="text-zinc-200 leading-snug">{{ act.text }}</p>
                <p class="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                  <Clock class="w-3 h-3" /> {{ act.time }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-zinc-800 text-center">
          <router-link
            to="/dashboard/inbox"
            class="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare class="w-3.5 h-3.5 text-orange-400" />
            <span>Buka Live Chat Multi-Agent</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
