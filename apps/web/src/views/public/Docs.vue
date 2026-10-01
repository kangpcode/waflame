<script setup lang="ts">
import { ref } from 'vue';
import { Flame, ArrowLeft, Terminal, ShieldCheck, Copy, Check } from 'lucide-vue-next';
import { useNotificationStore } from '../../stores/notification.js';

const notification = useNotificationStore();
const copiedIndex = ref<number | null>(null);

function copyCode(text: string, idx: number) {
  navigator.clipboard.writeText(text);
  copiedIndex.value = idx;
  notification.success('Kode berhasil disalin ke clipboard');
  setTimeout(() => (copiedIndex.value = null), 2000);
}
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col">
    <!-- Navbar -->
    <header class="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <router-link to="/" class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft class="w-4 h-4" /> Beranda
        </router-link>
        <span class="text-zinc-700">|</span>
        <div class="flex items-center gap-2 font-bold text-white">
          <Flame class="w-5 h-5 text-orange-500" />
          <span>Waflame REST API v1 Docs</span>
        </div>
      </div>

      <router-link
        to="/dashboard/api-keys"
        class="px-4 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors"
      >
        Buat API Key di Dashboard &rarr;
      </router-link>
    </header>

    <div class="max-w-6xl mx-auto w-full p-6 sm:p-10 space-y-12">
      <!-- Overview & Auth -->
      <section>
        <h1 class="text-3xl font-extrabold text-white">Dokumentasi REST API Publik</h1>
        <p class="text-zinc-400 mt-2 text-sm max-w-3xl leading-relaxed">
          Gunakan API Publik Waflame untuk mengintegrasikan pengiriman pesan WhatsApp secara programmatic dari aplikasi web, mobile app, backend, atau sistem CRM Anda.
        </p>

        <div class="mt-6 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-emerald-400" /> Autentikasi Menggunakan Header X-API-Key
          </h2>
          <p class="text-xs text-zinc-400 mt-2">
            Setiap request ke endpoint publik wajib menyertakan header <code class="text-orange-400 font-mono">X-API-Key</code> dengan kunci yang dibuat di dashboard:
          </p>
          <pre class="mt-3 p-3 rounded-xl bg-zinc-950 text-xs font-mono text-emerald-400 border border-zinc-800/80">X-API-Key: wf_live_caafc5050b6b12439ca3139953281b7d430e215396affa06</pre>
        </div>
      </section>

      <!-- Endpoint 1: Send Message -->
      <section class="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
          <span class="font-mono text-sm text-zinc-200">/api/v1/public/messages/send</span>
        </div>
        <p class="text-xs text-zinc-400">Kirim pesan WhatsApp instan (teks, gambar, dokumen, atau video).</p>

        <div class="space-y-2">
          <p class="text-xs font-semibold text-zinc-300">Payload Request (JSON):</p>
          <pre class="p-4 rounded-xl bg-zinc-950 text-xs font-mono text-zinc-300 border border-zinc-800 overflow-x-auto">{
  "deviceId": "dev_01j7q9abc...",    // ID Device yang terhubung (Official atau QR)
  "to": "6281234567890",             // Nomor WhatsApp tujuan format E.164
  "messageType": "TEXT",             // TEXT | IMAGE | DOCUMENT | VIDEO
  "content": "Halo! Pesanan #1024 telah dikirimkan via JNE REG.",
  "mediaUrl": "https://example.com/invoice.pdf" // (Opsional bila mengirim media)
}</pre>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold text-zinc-300">Contoh Response Berhasil (200 OK):</p>
          <pre class="p-4 rounded-xl bg-zinc-950 text-xs font-mono text-emerald-400 border border-zinc-800 overflow-x-auto">{
  "success": true,
  "message": "Pesan berhasil diantrekan untuk pengiriman",
  "data": {
    "messageId": "msg_01j7qa123...",
    "to": "6281234567890",
    "status": "QUEUED"
  }
}</pre>
        </div>
      </section>

      <!-- Endpoint 2: List Devices -->
      <section class="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">GET</span>
          <span class="font-mono text-sm text-zinc-200">/api/v1/public/devices</span>
        </div>
        <p class="text-xs text-zinc-400">Dapatkan daftar device WhatsApp dan status koneksinya.</p>
        <pre class="p-4 rounded-xl bg-zinc-950 text-xs font-mono text-zinc-300 border border-zinc-800 overflow-x-auto">{
  "success": true,
  "data": [
    {
      "id": "dev_01j7q9abc...",
      "name": "Customer Support WhatsApp 1",
      "phoneNumber": "6281234567890",
      "connectionType": "QR",
      "status": "CONNECTED"
    }
  ]
}</pre>
      </section>

      <!-- Webhook Outbound Specifications -->
      <section class="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <h2 class="text-lg font-bold text-white">Spesifikasi Webhook Outbound</h2>
        <p class="text-xs text-zinc-400 leading-relaxed">
          Waflame akan mengirimkan HTTP POST event ke server webhook Anda dengan tanda tangan HMAC-SHA256 pada header <code class="text-orange-400 font-mono">X-Waflame-Signature-256</code>.
        </p>
        <pre class="p-4 rounded-xl bg-zinc-950 text-xs font-mono text-zinc-300 border border-zinc-800 overflow-x-auto">// Verifikasi Tanda Tangan di Node.js
const crypto = require('crypto');
const signature = req.headers['x-waflame-signature-256'];
const computedHash = 'sha256=' + crypto.createHmac('sha256', secretKey).update(rawBody).digest('hex');

if (signature === computedHash) {
  // Payload terverifikasi otentik dari Waflame!
}</pre>
      </section>
    </div>
  </div>
</template>
