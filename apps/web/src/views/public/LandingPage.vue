<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import {
  Flame,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Code2,
  Terminal,
  ChevronDown,
  Layers,
  MessageSquare,
  Sparkles,
  Bot,
  ExternalLink,
  Smartphone,
  Server,
  Star,
} from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();

const activeTab = ref<'curl' | 'node' | 'python' | 'php'>('curl');

const openFaqIndex = ref<number | null>(0);

function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? null : index;
}

const faqs = [
  {
    q: 'Apa perbedaan mendasar antara Official Cloud API Meta dan QR Mode Baileys?',
    a: 'Official Cloud API didukung resmi oleh Meta dengan jaminan anti-blokir, centang hijau, dan pengiriman template skala jutaan. Sementara QR Mode menghubungkan WhatsApp Web melalui scan QR dengan keunggulan otomatisasi grup tanpa batas dan tanpa biaya per template pesan.',
  },
  {
    q: 'Apakah aman menggunakan QR Mode untuk broadcast pelanggan?',
    a: 'Waflame dilengkapi sistem proteksi anti-banned cerdas: spintax rotasi kata dinamis {halo|hai}, simulasi pengetikan (typing simulation), delay acak adaptif 3-10 detik, dan mode warming-up nomor baru untuk meminimalisir risiko pembatasan.',
  },
  {
    q: 'Bagaimana cara integrasi REST API Waflame ke aplikasi web saya?',
    a: 'Cukup buat API Key di dashboard, lalu panggil endpoint `/api/v1/public/messages/send` menggunakan header `X-API-Key`. Kami menyediakan contoh kode siap pakai dalam bahasa Node.js, PHP, Python, dan cURL.',
  },
  {
    q: 'Apakah mendukung multi-agent customer service?',
    a: 'Ya! Fitur Inbox Live Chat memungkinkan banyak agen customer service menangani percakapan pelanggan secara bersamaan dengan fitur penugasan agen, status tiket, dan catatan internal tim.',
  },
];
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-orange-500 selection:text-white">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/80">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Flame class="w-6 h-6 text-white" />
          </div>
          <span class="font-extrabold text-2xl tracking-wider text-white">
            WA<span class="text-orange-500">FLAME</span>
          </span>
        </router-link>

        <!-- Nav Links -->
        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#fitur" class="hover:text-orange-400 transition-colors">Fitur Unggulan</a>
          <a href="#komparasi" class="hover:text-orange-400 transition-colors">Official vs QR</a>
          <a href="#api" class="hover:text-orange-400 transition-colors">Integrasi API</a>
          <a href="#harga" class="hover:text-orange-400 transition-colors">Harga Paket</a>
          <a href="#faq" class="hover:text-orange-400 transition-colors">FAQ</a>
        </nav>

        <!-- Auth CTAs -->
        <div class="flex items-center gap-4">
          <router-link
            to="/login"
            class="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Masuk
          </router-link>
          <router-link
            to="/register"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Mulai Gratis
          </router-link>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-24 pb-20 overflow-hidden">
      <!-- Glow Gradients in Background -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div class="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-fire-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse">
          <Sparkles class="w-4 h-4" />
          WhatsApp Gateway Multi-Tenant Generasi Terbaru
        </div>

        <!-- Main Headline -->
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Kirim Pesan WhatsApp Skala Enterprise dengan <span class="text-gradient-flame">Dual Engine</span>
        </h1>

        <!-- Subtitle -->
        <p class="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Kombinasi resmi Meta Cloud API (Official WABA) dan Scan QR Baileys dalam satu platform modern. Dilengkapi broadcast anti-banned, multi-agent live chat, dan REST API berkecepatan tinggi.
        </p>

        <!-- CTA Buttons -->
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <router-link
            to="/register"
            class="px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5"
          >
            <span>Daftar Akun Sekarang</span>
            <ArrowRight class="w-5 h-5" />
          </router-link>

          <router-link
            to="/login"
            class="px-8 py-4 rounded-xl font-bold text-base bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-all flex items-center gap-2"
          >
            <span>Buka Dashboard Demo</span>
          </router-link>
        </div>

        <!-- Trust Badges -->
        <div class="mt-14 flex flex-wrap justify-center items-center gap-8 text-xs text-zinc-400 font-medium">
          <span class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" /> Jaminan Uptime 99.9%
          </span>
          <span class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" /> Enkripsi Token AES-256
          </span>
          <span class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" /> Sesi MariaDB Tahan Restart
          </span>
          <span class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" /> Queue Redis & BullMQ
          </span>
        </div>
      </div>
    </section>

    <!-- Dual Mode Comparison Section -->
    <section id="komparasi" class="py-20 bg-zinc-950/60 border-y border-zinc-800/80 relative">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Satu Platform, Dua Mode Koneksi WhatsApp
          </h2>
          <p class="mt-4 text-zinc-400 text-base">
            Pilih atau gabungkan mode koneksi sesuai kebutuhan operasional dan strategi pemasaran bisnis Anda.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Official Meta Card -->
          <div class="p-8 rounded-3xl bg-zinc-900/60 border border-blue-500/30 hover:border-blue-500/60 transition-all relative overflow-hidden group">
            <div class="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/30">
              <Server class="w-6 h-6" />
            </div>
            <div class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
              OFFICIAL WABA MODE
            </div>
            <h3 class="text-2xl font-bold text-white mb-3">Meta Cloud API (Resmi)</h3>
            <p class="text-zinc-400 text-sm mb-6 leading-relaxed">
              Koneksi langsung ke server Meta via Cloud API v21+. Sangat cocok untuk pengiriman transaksional, verifikasi OTP, notifikasi tagihan, dan brand bereputasi tinggi.
            </p>
            <ul class="space-y-3 text-sm text-zinc-300">
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-blue-400 shrink-0" />
                Dukungan centang hijau (Official Business Account)
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-blue-400 shrink-0" />
                Bebas risiko nomor diblokir oleh pihak WhatsApp
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-blue-400 shrink-0" />
                Manajemen Template pesan (Marketing, Utility, Auth)
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-blue-400 shrink-0" />
                Jendela Customer Service 24 jam otomatis
              </li>
            </ul>
          </div>

          <!-- Unofficial QR Card -->
          <div class="p-8 rounded-3xl bg-zinc-900/60 border border-orange-500/30 hover:border-orange-500/60 transition-all relative overflow-hidden group">
            <div class="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6 border border-orange-500/30">
              <Smartphone class="w-6 h-6" />
            </div>
            <div class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-3">
              QR SCAN WEB MODE
            </div>
            <h3 class="text-2xl font-bold text-white mb-3">Baileys Engine (QR Mode)</h3>
            <p class="text-zinc-400 text-sm mb-6 leading-relaxed">
              Koneksi instan cukup dengan scan QR WhatsApp Web. Sangat fleksibel untuk otomatisasi grup WhatsApp, pengiriman fleksibel tanpa pendaftaran template, dan biaya hemat.
            </p>
            <ul class="space-y-3 text-sm text-zinc-300">
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-orange-400 shrink-0" />
                Scan QR langsung aktif dalam 5 detik
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-orange-400 shrink-0" />
                Kirim pesan tanpa verifikasi template Meta
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-orange-400 shrink-0" />
                Full otomatisasi Grup (Invite bulk CSV, kick, info)
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-orange-400 shrink-0" />
                Proteksi Anti-Banned cerdas (Spintax & randomized delay)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Features Grid -->
    <section id="fitur" class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Fitur Komprehensif Skala Enterprise
          </h2>
          <p class="mt-4 text-zinc-400 text-base">
            Dirancang khusus untuk mendukung volume jutaan pesan, keandalan antrean pesan, dan kolaborasi tim.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Card 1 -->
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/40 transition-all">
            <div class="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
              <Radio class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-lg text-white mb-2">Smart Broadcast Engine</h3>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Jadwalkan pesan massal dengan filter tag dan grup. Proteksi anti-banned dengan spintax <code class="text-orange-400">{halo|hai}</code> dan variabel nama penerima.
            </p>
          </div>

          <!-- Card 2 -->
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/40 transition-all">
            <div class="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
              <MessageSquare class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-lg text-white mb-2">Inbox Multi-Agent CS</h3>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Kolaborasi banyak agen customer service dalam satu dashboard. Terdapat tiket status, penugasan percakapan, dan catatan internal khusus tim.
            </p>
          </div>

          <!-- Card 3 -->
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/40 transition-all">
            <div class="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
              <Bot class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-lg text-white mb-2">Auto Reply & Smart Bot</h3>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Respon otomatis 24/7 berdasarkan kata kunci (Exact, Contains, Regex) dan jadwal jam operasional bisnis kantor Anda.
            </p>
          </div>

          <!-- Card 4 -->
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/40 transition-all">
            <div class="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
              <Terminal class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-lg text-white mb-2">Public REST API & SDK</h3>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Akses cepat dengan API Key, sliding rate limiter Redis, dan dokumentasi Swagger interaktif yang siap disalin ke cURL, Node, PHP, dan Python.
            </p>
          </div>

          <!-- Card 5 -->
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/40 transition-all">
            <div class="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
              <Webhook class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-lg text-white mb-2">Outbound Webhooks</h3>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Kirim realtime event pesan masuk dan status kirim ke endpoint CRM Anda dengan verifikasi tanda tangan HMAC-SHA256 serta retry 3 kali.
            </p>
          </div>

          <!-- Card 6 -->
          <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/40 transition-all">
            <div class="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
              <Layers class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-lg text-white mb-2">Manajemen Grup & Kontak</h3>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Upload puluhan ribu kontak via CSV / Excel, normalisasi nomor otomatis ke format internasional E.164, dan invite massal ke grup WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive API Section -->
    <section id="api" class="py-20 bg-zinc-950/80 border-t border-zinc-800/80">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-5">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold mb-4">
              <Code2 class="w-4 h-4" /> DEVELOPER FRIENDLY
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Integrasi REST API dalam Hitungan Menit
            </h2>
            <p class="mt-4 text-zinc-400 text-sm leading-relaxed">
              Kirim pesan instan dari aplikasi apa saja. Sistem rate limit cerdas menjaga performa API tetap stabil dalam situasi traffic tinggi.
            </p>
            <div class="mt-8 space-y-3">
              <div class="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                Autentikasi Header <code class="text-orange-400">X-API-Key: wf_live_...</code>
              </div>
              <div class="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                Respons format JSON terstruktur standar REST
              </div>
              <div class="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                Webhook event dengan verifikasi <code class="text-orange-400">HMAC-SHA256</code>
              </div>
            </div>
            <div class="mt-8">
              <router-link
                to="/docs"
                class="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Lihat Dokumentasi API Lengkap &rarr;
              </router-link>
            </div>
          </div>

          <div class="lg:col-span-7">
            <!-- Code Block Component -->
            <div class="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
              <!-- Code Tabs -->
              <div class="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  <span class="text-xs text-zinc-500 ml-2 font-mono">POST /api/v1/public/messages/send</span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    @click="activeTab = 'curl'"
                    class="px-2.5 py-1 rounded text-xs font-mono transition-colors"
                    :class="activeTab === 'curl' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  >
                    cURL
                  </button>
                  <button
                    @click="activeTab = 'node'"
                    class="px-2.5 py-1 rounded text-xs font-mono transition-colors"
                    :class="activeTab === 'node' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  >
                    Node.js
                  </button>
                  <button
                    @click="activeTab = 'php'"
                    class="px-2.5 py-1 rounded text-xs font-mono transition-colors"
                    :class="activeTab === 'php' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  >
                    PHP
                  </button>
                  <button
                    @click="activeTab = 'python'"
                    class="px-2.5 py-1 rounded text-xs font-mono transition-colors"
                    :class="activeTab === 'python' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  >
                    Python
                  </button>
                </div>
              </div>

              <!-- Code Content -->
              <div class="p-5 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed bg-[#0d0d10]">
                <div v-if="activeTab === 'curl'">
                  <p class="text-zinc-500"># Kirim pesan teks WhatsApp instan</p>
                  <p class="text-orange-400 font-semibold">curl -X POST https://api.waflame.com/api/v1/public/messages/send \</p>
                  <p class="pl-4 text-emerald-400">-H "X-API-Key: wf_live_9a8b7c6d5e4f3a2b1c0d"</p>
                  <p class="pl-4 text-emerald-400">-H "Content-Type: application/json"</p>
                  <p class="pl-4 text-emerald-400">-d '{</p>
                  <p class="pl-8 text-zinc-300">"deviceId": "dev_01j7q9...",</p>
                  <p class="pl-8 text-zinc-300">"to": "6281234567890",</p>
                  <p class="pl-8 text-zinc-300">"messageType": "TEXT",</p>
                  <p class="pl-8 text-zinc-300">"content": "Halo! Kode OTP login Anda adalah: 482910."</p>
                  <p class="pl-4 text-emerald-400">}'</p>
                </div>

                <div v-else-if="activeTab === 'node'">
                  <p class="text-zinc-500">// Kirim via Fetch API / Axios di Node.js</p>
                  <p class="text-cyan-400">const response = await fetch('https://api.waflame.com/api/v1/public/messages/send', {</p>
                  <p class="pl-4 text-zinc-300">method: 'POST',</p>
                  <p class="pl-4 text-zinc-300">headers: {</p>
                  <p class="pl-8 text-emerald-400">'X-API-Key': process.env.WAFLAME_API_KEY,</p>
                  <p class="pl-8 text-emerald-400">'Content-Type': 'application/json'</p>
                  <p class="pl-4 text-zinc-300">},</p>
                  <p class="pl-4 text-zinc-300">body: JSON.stringify({</p>
                  <p class="pl-8 text-zinc-300">deviceId: 'dev_01j7q9...',</p>
                  <p class="pl-8 text-zinc-300">to: '6281234567890',</p>
                  <p class="pl-8 text-zinc-300">messageType: 'TEXT',</p>
                  <p class="pl-8 text-zinc-300">content: 'Halo! Pembayaran Anda sebesar Rp 150.000 telah kami terima.'</p>
                  <p class="pl-4 text-zinc-300">})</p>
                  <p class="text-cyan-400">});</p>
                </div>

                <div v-else-if="activeTab === 'php'">
                  <p class="text-zinc-500">// Contoh cURL PHP</p>
                  <p class="text-purple-400">$ch = curl_init('https://api.waflame.com/api/v1/public/messages/send');</p>
                  <p class="text-zinc-300">curl_setopt($ch, CURLOPT_HTTPHEADER, [</p>
                  <p class="pl-4 text-emerald-400">'X-API-Key: ' . $apiKey,</p>
                  <p class="pl-4 text-emerald-400">'Content-Type: application/json'</p>
                  <p class="text-zinc-300">]);</p>
                  <p class="text-zinc-300">curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([</p>
                  <p class="pl-4 text-zinc-300">'deviceId' => 'dev_01j7q9...',</p>
                  <p class="pl-4 text-zinc-300">'to' => '6281234567890',</p>
                  <p class="pl-4 text-zinc-300">'messageType' => 'TEXT',</p>
                  <p class="pl-4 text-zinc-300">'content' => 'Pesanan Anda sedang dalam pengiriman.'</p>
                  <p class="text-zinc-300">]));</p>
                  <p class="text-purple-400">$result = curl_exec($ch);</p>
                </div>

                <div v-else>
                  <p class="text-zinc-500"># Contoh Python requests</p>
                  <p class="text-yellow-400">import requests</p>
                  <p class="text-zinc-300">res = requests.post(</p>
                  <p class="pl-4 text-emerald-400">'https://api.waflame.com/api/v1/public/messages/send',</p>
                  <p class="pl-4 text-zinc-300">headers={'X-API-Key': 'wf_live_...'},</p>
                  <p class="pl-4 text-zinc-300">json={</p>
                  <p class="pl-8 text-zinc-300">'deviceId': 'dev_01j7q9...',</p>
                  <p class="pl-8 text-zinc-300">'to': '6281234567890',</p>
                  <p class="pl-8 text-zinc-300">'messageType': 'TEXT',</p>
                  <p class="pl-8 text-zinc-300">'content': 'Peringatan otomatis server!'</p>
                  <p class="pl-4 text-zinc-300">}</p>
                  <p class="text-zinc-300">)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="harga" class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Pilihan Paket Berlangganan Fleksibel
          </h2>
          <p class="mt-4 text-zinc-400 text-base">
            Tanpa biaya tersembunyi. Upgrade atau batalkan paket kapan saja secara langsung dari dashboard.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Starter Tier -->
          <div class="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-xl text-white">Starter</h3>
              <p class="text-xs text-zinc-400 mt-1">Untuk toko online & UMKM pemula</p>
              <div class="mt-6 flex items-baseline gap-1">
                <span class="text-3xl font-extrabold text-white">Rp 149.000</span>
                <span class="text-xs text-zinc-400">/ bulan</span>
              </div>
              <ul class="mt-8 space-y-3 text-sm text-zinc-300">
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> 1 Perangkat QR / Official
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> 5.000 Pesan / bulan
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> 1.000 Kontak tersimpan
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> 1 Akun Customer Service
                </li>
              </ul>
            </div>
            <router-link
              to="/register"
              class="mt-8 w-full py-3 rounded-xl font-bold text-center text-sm bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              Pilih Starter
            </router-link>
          </div>

          <!-- Flame Business Tier (Highlighted) -->
          <div class="p-8 rounded-3xl bg-zinc-900/80 border-2 border-orange-500 relative flex flex-col justify-between shadow-2xl shadow-orange-500/15">
            <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
              PALING POPULER
            </div>
            <div>
              <h3 class="font-bold text-xl text-white">Business Flame</h3>
              <p class="text-xs text-orange-300/80 mt-1">Untuk bisnis berkembang & agensi</p>
              <div class="mt-6 flex items-baseline gap-1">
                <span class="text-4xl font-extrabold text-white">Rp 449.000</span>
                <span class="text-xs text-zinc-400">/ bulan</span>
              </div>
              <ul class="mt-8 space-y-3 text-sm text-zinc-200">
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-400" /> 5 Perangkat WhatsApp
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-400" /> 50.000 Pesan / bulan
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-400" /> 20.000 Kontak & Grup
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-400" /> 5 Akun CS Multi-Agent
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-400" /> Akses REST API & Webhook
                </li>
              </ul>
            </div>
            <router-link
              to="/register"
              class="mt-8 w-full py-3.5 rounded-xl font-bold text-center text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all"
            >
              Mulai Langganan Business
            </router-link>
          </div>

          <!-- Enterprise Tier -->
          <div class="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-xl text-white">Enterprise Pro</h3>
              <p class="text-xs text-zinc-400 mt-1">Untuk skala korporasi & volume tinggi</p>
              <div class="mt-6 flex items-baseline gap-1">
                <span class="text-3xl font-extrabold text-white">Rp 1.490.000</span>
                <span class="text-xs text-zinc-400">/ bulan</span>
              </div>
              <ul class="mt-8 space-y-3 text-sm text-zinc-300">
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> Unlimited Devices
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> 250.000+ Pesan / bulan
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> Unlimited Kontak
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> Unlimited Agen Customer Service
                </li>
                <li class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-orange-400" /> Priority Support & Dedicated Server
                </li>
              </ul>
            </div>
            <router-link
              to="/register"
              class="mt-8 w-full py-3 rounded-xl font-bold text-center text-sm bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              Hubungi Tim Sales
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion -->
    <section id="faq" class="py-20 bg-zinc-950/60 border-t border-zinc-800/80">
      <div class="max-w-4xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-extrabold tracking-tight">Pertanyaan yang Sering Diajukan (FAQ)</h2>
          <p class="mt-3 text-zinc-400 text-sm">Informasi penting mengenai cara kerja dan kepatuhan operasional Waflame.</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(item, idx) in faqs"
            :key="idx"
            class="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden"
          >
            <button
              @click="toggleFaq(idx)"
              class="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-zinc-100 hover:text-orange-400 transition-colors"
            >
              <span>{{ item.q }}</span>
              <ChevronDown
                class="w-5 h-5 text-zinc-400 transition-transform duration-200 shrink-0"
                :class="{ 'rotate-180 text-orange-400': openFaqIndex === idx }"
              />
            </button>
            <div
              v-show="openFaqIndex === idx"
              class="px-6 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3"
            >
              {{ item.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 text-xs">
      <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <Flame class="w-5 h-5 text-orange-500" />
          </div>
          <span class="font-bold text-white text-sm">WAFLAME</span>
          <span class="text-zinc-600">|</span>
          <span>&copy; {{ new Date().getFullYear() }} Waflame Technologies Inc. Hak cipta dilindungi.</span>
        </div>

        <div class="flex items-center gap-6">
          <router-link to="/docs" class="hover:text-white transition-colors">Dokumentasi API</router-link>
          <router-link to="/terms" class="hover:text-white transition-colors">Syarat & Ketentuan</router-link>
          <router-link to="/privacy" class="hover:text-white transition-colors">Kebijakan Privasi</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>
