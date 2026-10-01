<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import { Flame, Lock, Mail, User, Building, ArrowRight, CheckCircle2 } from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();
const notification = useNotificationStore();

const tenantName = ref('');
const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleRegister() {
  if (!tenantName.value || !name.value || !email.value || !password.value) {
    notification.warning('Semua kolom form wajib diisi');
    return;
  }

  loading.value = true;
  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantName: tenantName.value,
        name: name.value,
        email: email.value,
        password: password.value,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Pendaftaran gagal');
    }

    notification.success('Akun & workspace berhasil dibuat! Silakan masuk.');
    router.push('/login');
  } catch (err: any) {
    notification.error(err.message || 'Gagal mendaftarkan akun');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none"></div>

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
        <h2 class="text-2xl font-bold text-white mt-4">Buat Akun Bisnis Baru</h2>
        <p class="text-sm text-zinc-400 mt-1">Mulai uji coba gratis platform WhatsApp Gateway enterprise</p>
      </div>

      <div class="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Nama Perusahaan / Bisnis</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Building class="w-4 h-4" />
              </div>
              <input
                v-model="tenantName"
                type="text"
                required
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="PT Solusi Digital Sejahtera"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Nama Lengkap Penanggung Jawab</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User class="w-4 h-4" />
              </div>
              <input
                v-model="name"
                type="text"
                required
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Budi Santoso"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Email Bisnis</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail class="w-4 h-4" />
              </div>
              <input
                v-model="email"
                type="email"
                required
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="budi@solusidigital.com"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Kata Sandi (Min. 8 Karakter)</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="password"
                type="password"
                minlength="8"
                required
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span v-if="!loading">Daftar Akun Bisnis</span>
            <span v-else>Membuat Akun...</span>
            <ArrowRight v-if="!loading" class="w-4 h-4" />
          </button>
        </form>

        <div class="mt-6 text-center text-xs text-zinc-400">
          Sudah memiliki akun Waflame?
          <router-link to="/login" class="text-orange-400 font-semibold hover:underline ml-1">
            Masuk disini
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
