<script setup lang="ts">
import { Flame, ArrowLeft } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 max-w-4xl mx-auto">
    <div class="py-8">
      <router-link to="/" class="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-6">
        <ArrowLeft class="w-4 h-4" /> Kembali ke Beranda
      </router-link>
      <h1 class="text-3xl font-extrabold text-white mb-4">Kebijakan Privasi (Privacy Policy)</h1>
      <p class="text-xs text-zinc-500 mb-8">Terakhir diperbarui: 1 Oktober 2026</p>

      <div class="space-y-6 text-sm text-zinc-300 leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-white mb-2">1. Perlindungan Data & Keamanan</h2>
          <p>Waflame memperlakukan privasi data pelanggan Anda dengan standar industri tertinggi. Seluruh token autentikasi, access token Meta, dan kredensial sensitif dienkripsi menggunakan standar AES-256 dan hash Argon2id.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-white mb-2">2. Isolasi Multi-Tenant</h2>
          <p>Setiap tenant memiliki isolasi data ketat di level database. Kontak, pesan, kampanye, dan riwayat percakapan tidak dapat diakses oleh tenant lain.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-white mb-2">3. Hak Akses & Penghapusan</h2>
          <p>Anda memiliki kendali penuh untuk mengekspor atau menghapus basis data kontak dan percakapan kapan saja melalui dashboard atau REST API.</p>
        </section>
      </div>
    </div>
  </div>
</template>
