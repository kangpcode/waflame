<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import { Flame, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();
const notification = useNotificationStore();

const email = ref('admin@waflame.com');
const password = ref('SuperSecretPassword123!');
const loading = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) {
    notification.warning('Email dan password wajib diisi');
    return;
  }

  loading.value = true;
  try {
    const ok = await auth.login(email.value, password.value);
    if (ok) {
      notification.success('Selamat datang kembali di Waflame!');
      router.push('/dashboard');
    }
  } catch (err: any) {
    notification.error(err.message || 'Login gagal');
  } finally {
    loading.value = false;
  }
}

function quickDemoLogin(role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT') {
  auth.setDemoSession(role);
  notification.success(`Masuk dalam mode simulasi: ${role}`);
  router.push('/dashboard');
}
</script>

<template>
  <div class="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Glow Background -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none"></div>

    <div class="max-w-md w-full relative z-10">
      <!-- Logo Header -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Flame class="w-7 h-7 text-white" />
          </div>
          <span class="font-extrabold text-3xl tracking-wider text-white">
            WA<span class="text-orange-500">FLAME</span>
          </span>
        </router-link>
        <h2 class="text-2xl font-bold text-white mt-4">Masuk ke Workspace</h2>
        <p class="text-sm text-zinc-400 mt-1">Kelola gateway WhatsApp dan percakapan pelanggan bisnis Anda</p>
      </div>

      <!-- Quick Demo Login Bar -->
      <div class="mb-6 p-3.5 rounded-2xl bg-zinc-900/80 border border-orange-500/30 backdrop-blur-md">
        <p class="text-xs font-semibold text-orange-400 flex items-center gap-1.5 mb-2">
          <Sparkles class="w-3.5 h-3.5" /> 1-Click Demo Login (Evaluasi Cepat):
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="quickDemoLogin('SUPER_ADMIN')"
            class="px-2 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30 transition-all text-center"
          >
            Super Admin
          </button>
          <button
            type="button"
            @click="quickDemoLogin('ADMIN')"
            class="px-2 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-all text-center"
          >
            Owner (Tenant)
          </button>
          <button
            type="button"
            @click="quickDemoLogin('AGENT')"
            class="px-2 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 transition-all text-center"
          >
            CS Agent
          </button>
        </div>
      </div>

      <!-- Main Login Card -->
      <div class="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <form @submit.prevent="handleLogin" class="space-y-5">
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

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">Kata Sandi</label>
              <router-link to="/forgot-password" class="text-xs text-orange-400 hover:text-orange-300">
                Lupa sandi?
              </router-link>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="password"
                type="password"
                required
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span v-if="!loading">Masuk ke Dashboard</span>
            <span v-else>Memproses...</span>
            <ArrowRight v-if="!loading" class="w-4 h-4" />
          </button>
        </form>

        <div class="mt-6 text-center text-xs text-zinc-400">
          Belum memiliki akun Waflame?
          <router-link to="/register" class="text-orange-400 font-semibold hover:underline ml-1">
            Daftar sekarang
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
