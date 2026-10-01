<script setup lang="ts">
import { Flame, ArrowLeft } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 max-w-4xl mx-auto">
    <div class="py-8">
      <router-link to="/" class="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-6">
        <ArrowLeft class="w-4 h-4" /> Kembali ke Beranda
      </router-link>
      <h1 class="text-3xl font-extrabold text-white mb-4">Syarat & Ketentuan Layanan (Terms of Service)</h1>
      <p class="text-xs text-zinc-500 mb-8">Terakhir diperbarui: 1 Oktober 2026</p>

      <div class="space-y-6 text-sm text-zinc-300 leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-white mb-2">1. Ketentuan Umum</h2>
          <p>Waflame menyediakan layanan platform WhatsApp Gateway multi-tenant dengan dua mode koneksi: Official Meta Cloud API dan QR Mode (Baileys). Dengan mendaftar, Anda menyetujui seluruh ketentuan ini.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-white mb-2">2. Penggunaan Official vs QR Mode</h2>
          <p>Untuk QR Mode (Unofficial), pengguna memahami bahwa koneksi didasarkan pada protokol WhatsApp Web reverse-engineered. Pengguna bertanggung jawab penuh atas reputasi nomor dan kepatuhan anti-spam. Waflame menyediakan fitur pencegahan (spintax, delays, limits), namun tidak bertanggung jawab atas tindakan pemblokiran oleh WhatsApp Inc.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-white mb-2">3. Kebijakan Anti-Spam</h2>
          <p>Dilarang keras mengirimkan pesan spam, judi online, phishing, penipuan, atau konten yang melanggar hukum Republik Indonesia. Pelanggaran berat akan mengakibatkan penutupan akun secara permanen tanpa pengembalian dana.</p>
        </section>
      </div>
    </div>
  </div>
</template>
