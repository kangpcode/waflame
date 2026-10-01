<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import { Settings, Building, Clock, Save, Shield } from 'lucide-vue-next';

const auth = useAuthStore();
const notification = useNotificationStore();

const workspaceName = ref(auth.user?.tenantName || 'PT Maju Bersama');
const contactEmail = ref('admin@business.com');
const timezone = ref('Asia/Jakarta');
const startTime = ref('08:00');
const endTime = ref('17:00');

function handleSaveSettings() {
  notification.success('Pengaturan workspace berhasil disimpan!');
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-extrabold text-white tracking-tight">Pengaturan Workspace & Jam Kerja</h1>
      <p class="text-sm text-zinc-400 mt-1">Konfigurasikan informasi profil bisnis dan aturan jam operasional layanan WhatsApp.</p>
    </div>

    <div class="p-8 rounded-3xl bg-[#121215] border border-zinc-800/80 shadow-xl space-y-6">
      <form @submit.prevent="handleSaveSettings" class="space-y-6">
        <div>
          <h3 class="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Building class="w-4 h-4 text-orange-400" /> Profil Bisnis
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nama Perusahaan / Workspace</label>
              <input v-model="workspaceName" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Email Kontak Resmi</label>
              <input v-model="contactEmail" type="email" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" />
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-zinc-800">
          <h3 class="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Clock class="w-4 h-4 text-orange-400" /> Jadwal Jam Operasional Customer Service
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Zona Waktu</label>
              <select v-model="timezone" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100">
                <option value="Asia/Jakarta">WIB (Asia/Jakarta - UTC+7)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar - UTC+8)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura - UTC+9)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Jam Buka</label>
              <input v-model="startTime" type="time" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 text-center" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Jam Tutup</label>
              <input v-model="endTime" type="time" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 text-center" />
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            class="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
