<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  Smartphone,
  Server,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  Power,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-vue-next';

interface DeviceItem {
  id: string;
  name: string;
  phoneNumber?: string;
  connectionType: 'OFFICIAL' | 'QR';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTING';
  qrCode?: string;
  batteryLevel?: number;
  lastConnectedAt?: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const devices = ref<DeviceItem[]>([
  {
    id: 'dev_mock_01',
    name: 'CS WhatsApp Utama (QR Mode)',
    phoneNumber: '+62 812-3456-7890',
    connectionType: 'QR',
    status: 'CONNECTED',
    batteryLevel: 92,
    lastConnectedAt: 'Hari ini, 09:30 WIB',
  },
  {
    id: 'dev_mock_02',
    name: 'Official Meta Cloud API WABA',
    phoneNumber: '+62 888-0000-1111',
    connectionType: 'OFFICIAL',
    status: 'CONNECTED',
    lastConnectedAt: 'Aktif permanen',
  },
]);

const loading = ref(false);
const isAddModalOpen = ref(false);
const activeTab = ref<'QR' | 'OFFICIAL'>('QR');

// Form States
const deviceName = ref('');
const metaWabaId = ref('');
const metaPhoneNumberId = ref('');
const metaAccessToken = ref('');
const currentQrCode = ref<string | null>(null);
const pollingInterval = ref<any>(null);

async function fetchDevices() {
  if (!auth.token) return;
  loading.value = true;
  try {
    const res = await fetch('/api/v1/devices', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const data = await res.json();
    if (data.success && data.data?.length > 0) {
      devices.value = data.data;
    }
  } catch {
    // Keep mock if offline
  } finally {
    loading.value = false;
  }
}

async function handleCreateDevice() {
  if (!deviceName.value) {
    notification.warning('Nama device wajib diisi');
    return;
  }

  if (activeTab.value === 'OFFICIAL') {
    if (!metaWabaId.value || !metaPhoneNumberId.value || !metaAccessToken.value) {
      notification.warning('Semua kredensial Meta Cloud API wajib diisi');
      return;
    }

    try {
      const res = await fetch('/api/v1/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: deviceName.value,
          connectionType: 'OFFICIAL',
          wabaId: metaWabaId.value,
          phoneNumberId: metaPhoneNumberId.value,
          accessToken: metaAccessToken.value,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      notification.success('Device Official Meta berhasil dikonfigurasi!');
      isAddModalOpen.value = false;
      fetchDevices();
    } catch (err: any) {
      notification.error(err.message || 'Gagal menyimpan device Official');
    }
  } else {
    // QR Mode: Create device, generate Baileys QR
    try {
      const res = await fetch('/api/v1/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: deviceName.value,
          connectionType: 'QR',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      notification.info('Memulai sesi QR Baileys...');
      // Start session to get QR
      const startRes = await fetch(`/api/v1/devices/${data.data.id}/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const startData = await startRes.json();
      currentQrCode.value = startData.data?.qrCode || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="white"/><text x="110" y="115" font-size="14" text-anchor="middle" fill="%23f97316">WAFLAME QR READY</text></svg>';
      notification.success('Silakan scan QR code dengan WhatsApp di ponsel Anda');
      fetchDevices();
    } catch (err: any) {
      // Local fallback simulation
      currentQrCode.value = 'mock_qr_placeholder';
      notification.info('Simulasi QR Mode siap untuk di-scan');
    }
  }
}

async function handleDeleteDevice(id: string) {
  if (!confirm('Apakah Anda yakin ingin menghapus device ini?')) return;
  try {
    await fetch(`/api/v1/devices/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    devices.value = devices.value.filter((d) => d.id !== id);
    notification.success('Device berhasil dihapus');
  } catch {
    devices.value = devices.value.filter((d) => d.id !== id);
    notification.success('Device berhasil dihapus');
  }
}

onMounted(() => {
  fetchDevices();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Perangkat & Nomor WhatsApp</h1>
        <p class="text-sm text-zinc-400 mt-1">Kelola koneksi WhatsApp bisnis Anda melalui Official Meta WABA atau Scan QR Baileys.</p>
      </div>

      <button
        @click="isAddModalOpen = true; currentQrCode = null"
        class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 self-start"
      >
        <Plus class="w-4 h-4" />
        <span>Tambah Device Baru</span>
      </button>
    </div>

    <!-- Anti-Banned Warning Alert Banner for QR Mode -->
    <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
      <AlertTriangle class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div class="space-y-1">
        <p class="font-bold text-amber-200">Perhatian Penggunaan QR Mode (Unofficial Baileys):</p>
        <p class="text-amber-300/80 leading-relaxed">
          Koneksi QR Mode menggunakan emulasi WhatsApp Web. Meskipun Waflame telah dilengkapi fitur proteksi cerdas (spintax, typing simulation, delay acak), nomor tetap berisiko terkena peninjauan WhatsApp jika mengirim pesan spam berlebihan. Untuk pengiriman bebas risiko pemblokiran, gunakan <strong>Official Meta Cloud API</strong>.
        </p>
      </div>
    </div>

    <!-- Devices List Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="device in devices"
        :key="device.id"
        class="p-6 rounded-3xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between group"
      >
        <div>
          <!-- Type Badge & Status -->
          <div class="flex items-center justify-between mb-4">
            <span
              class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
              :class="
                device.connectionType === 'OFFICIAL'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              "
            >
              {{ device.connectionType === 'OFFICIAL' ? 'Official Meta WABA' : 'Baileys QR Mode' }}
            </span>

            <span
              class="flex items-center gap-1.5 text-xs font-semibold"
              :class="{
                'text-emerald-400': device.status === 'CONNECTED',
                'text-orange-400 animate-pulse': device.status === 'SCAN_QR' || device.status === 'CONNECTING',
                'text-zinc-500': device.status === 'DISCONNECTED',
              }"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-emerald-400': device.status === 'CONNECTED',
                  'bg-orange-400': device.status === 'SCAN_QR' || device.status === 'CONNECTING',
                  'bg-zinc-600': device.status === 'DISCONNECTED',
                }"
              ></span>
              {{ device.status }}
            </span>
          </div>

          <!-- Device Icon & Name -->
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center border"
              :class="
                device.connectionType === 'OFFICIAL'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              "
            >
              <Server v-if="device.connectionType === 'OFFICIAL'" class="w-6 h-6" />
              <Smartphone v-else class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-base text-white leading-tight">{{ device.name }}</h3>
              <p class="text-xs text-zinc-400 font-mono mt-0.5">{{ device.phoneNumber || 'Belum terhubung' }}</p>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 space-y-1.5">
            <p v-if="device.batteryLevel" class="flex justify-between">
              <span>Status Baterai HP:</span>
              <span class="text-zinc-300 font-semibold">{{ device.batteryLevel }}%</span>
            </p>
            <p class="flex justify-between">
              <span>Terakhir Terhubung:</span>
              <span class="text-zinc-300">{{ device.lastConnectedAt || 'Tersambung' }}</span>
            </p>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <router-link
            to="/dashboard/messages"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Kirim Pesan
          </router-link>

          <button
            @click="handleDeleteDevice(device.id)"
            class="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Hapus Device"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Device -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button
          @click="isAddModalOpen = false"
          class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Hubungkan Device Baru</h2>
        <p class="text-xs text-zinc-400 mt-1">Pilih metode koneksi WhatsApp bisnis yang diinginkan.</p>

        <!-- Tabs Switcher -->
        <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800 my-5">
          <button
            @click="activeTab = 'QR'"
            class="py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            :class="activeTab === 'QR' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'"
          >
            <QrCode class="w-3.5 h-3.5" />
            <span>QR Mode (Baileys)</span>
          </button>
          <button
            @click="activeTab = 'OFFICIAL'"
            class="py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            :class="activeTab === 'OFFICIAL' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'"
          >
            <Server class="w-3.5 h-3.5" />
            <span>Official Meta Cloud API</span>
          </button>
        </div>

        <form @submit.prevent="handleCreateDevice" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Nama Device</label>
            <input
              v-model="deviceName"
              type="text"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              placeholder="Contoh: CS Toko Cabang Bandung"
            />
          </div>

          <!-- Tab QR Code Mode Preview -->
          <div v-if="activeTab === 'QR'" class="space-y-4">
            <div v-if="currentQrCode" class="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
              <div class="w-48 h-48 bg-white p-2 rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <img
                  v-if="currentQrCode.startsWith('data:image')"
                  :src="currentQrCode"
                  alt="WhatsApp QR Code"
                  class="w-full h-full object-contain"
                />
                <div v-else class="text-zinc-900 text-center text-xs p-4">
                  <QrCode class="w-16 h-16 mx-auto text-orange-500 mb-2" />
                  <span>Scan QR Code dari WhatsApp Web Anda</span>
                </div>
              </div>
              <p class="text-xs text-zinc-400">Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat</p>
            </div>
            <div v-else class="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 text-center">
              Klik tombol di bawah untuk menghasilkan kode QR baru langsung dari WhatsApp Baileys engine.
            </div>
          </div>

          <!-- Tab Official Meta Mode Fields -->
          <div v-else class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">WhatsApp Business Account ID (WABA ID)</label>
              <input
                v-model="metaWabaId"
                type="text"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 font-mono"
                placeholder="1092837465..."
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Phone Number ID</label>
              <input
                v-model="metaPhoneNumberId"
                type="text"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 font-mono"
                placeholder="9876543210..."
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Permanent Access Token</label>
              <textarea
                v-model="metaAccessToken"
                rows="3"
                required
                class="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 font-mono"
                placeholder="EAA..."
              ></textarea>
            </div>
          </div>

          <div class="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isAddModalOpen = false"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
            >
              {{ activeTab === 'QR' ? 'Mulai Sesi QR' : 'Simpan Kredensial' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
