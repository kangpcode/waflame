<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '../../stores/notification.js';
import { Flame, Mail, ArrowLeft, Send } from 'lucide-vue-next';

const notification = useNotificationStore();
const email = ref('');
const submitted = ref(false);

function handleSubmit() {
  if (!email.value) return;
  submitted.value = true;
  notification.success('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
}
</script>

<template>
  <div class="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
    <div class="max-w-md w-full relative z-10">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Flame class="w-7 h-7 text-white" />
          </div>
          <span class="font-extrabold text-3xl tracking-wider text-white">
            WA<span class="text-orange-500">FLAME</span>
          </span>
        </router-link>
        <h2 class="text-2xl font-bold text-white mt-4">Pemulihan Kata Sandi</h2>
        <p class="text-sm text-zinc-400 mt-1">Masukkan alamat email Anda untuk menerima instruksi reset sandi</p>
      </div>

      <div class="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div v-if="submitted" class="text-center py-4">
          <p class="text-emerald-400 font-semibold mb-2">Email Pemulihan Terkirim!</p>
          <p class="text-xs text-zinc-400 mb-6">Silakan periksa kotak masuk atau spam email Anda.</p>
          <router-link to="/login" class="text-xs text-orange-400 hover:underline">
            &larr; Kembali ke Halaman Masuk
          </router-link>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Email Akun</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail class="w-4 h-4" />
              </div>
              <input
                v-model="email"
                type="email"
                required
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="nama@perusahaan.com"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Kirim Instruksi Pemulihan</span>
            <Send class="w-4 h-4" />
          </button>

          <div class="text-center pt-2">
            <router-link to="/login" class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
              <ArrowLeft class="w-3.5 h-3.5" /> Kembali ke Login
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
