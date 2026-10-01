<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  Users,
  Plus,
  Upload,
  Search,
  Tag,
  ShieldBan,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-vue-next';

interface ContactItem {
  id: string;
  name: string;
  phoneNumber: string;
  tags?: string[];
  isBlacklisted?: boolean;
  city?: string;
  createdAt: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const searchQuery = ref('');
const contacts = ref<ContactItem[]>([
  { id: '1', name: 'Budi Santoso', phoneNumber: '+6281234567890', tags: ['VIP', 'Pelanggan Lama'], city: 'Jakarta', createdAt: '2026-09-15' },
  { id: '2', name: 'Siti Rahma', phoneNumber: '+6281987654321', tags: ['Calon Buyer'], city: 'Bandung', createdAt: '2026-09-18' },
  { id: '3', name: 'Agus Pratama', phoneNumber: '+6285211223344', tags: ['VIP'], city: 'Surabaya', createdAt: '2026-09-20' },
  { id: '4', name: 'Dewi Anggraeni', phoneNumber: '+6287733445566', tags: ['Member'], city: 'Yogyakarta', createdAt: '2026-09-25' },
  { id: '5', name: 'Rian Hidayat', phoneNumber: '+6289655443322', tags: [], isBlacklisted: true, city: 'Semarang', createdAt: '2026-09-28' },
]);

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value;
  const q = searchQuery.value.toLowerCase();
  return contacts.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q) || c.city?.toLowerCase().includes(q)
  );
});

// Modals
const isAddModalOpen = ref(false);
const isImportModalOpen = ref(false);

const formName = ref('');
const formPhone = ref('');
const formCity = ref('');
const formTags = ref('');

// Import CSV Simulation
const importFile = ref<File | null>(null);
const importUploading = ref(false);

function handleAddContact() {
  if (!formName.value || !formPhone.value) {
    notification.warning('Nama dan nomor telepon wajib diisi');
    return;
  }

  contacts.value.unshift({
    id: 'ct_' + Date.now(),
    name: formName.value,
    phoneNumber: formPhone.value,
    city: formCity.value,
    tags: formTags.value ? formTags.value.split(',').map((t) => t.trim()) : [],
    createdAt: new Date().toISOString().split('T')[0],
  });

  notification.success(`Kontak "${formName.value}" berhasil ditambahkan.`);
  isAddModalOpen.value = false;
  formName.value = '';
  formPhone.value = '';
}

function handleFileSelect(e: any) {
  if (e.target.files && e.target.files[0]) {
    importFile.value = e.target.files[0];
  }
}

async function handleRunImport() {
  if (!importFile.value) {
    notification.warning('Pilih file CSV atau Excel terlebih dahulu');
    return;
  }

  importUploading.value = true;
  setTimeout(() => {
    importUploading.value = false;
    notification.success(`Berhasil mengimpor 150 kontak dari file ${importFile.value?.name}!`);
    isImportModalOpen.value = false;
    importFile.value = null;
  }, 1200);
}

function handleDeleteContact(id: string) {
  contacts.value = contacts.value.filter((c) => c.id !== id);
  notification.success('Kontak berhasil dihapus');
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Manajemen Kontak & Audiens</h1>
        <p class="text-sm text-zinc-400 mt-1">Simpan, kelompokkan tag, dan impor puluhan ribu kontak pelanggan dengan normalisasi E.164.</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="isImportModalOpen = true"
          class="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2"
        >
          <Upload class="w-3.5 h-3.5 text-orange-400" />
          <span>Import CSV / Excel</span>
        </button>

        <button
          @click="isAddModalOpen = true"
          class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Kontak</span>
        </button>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="p-4 rounded-2xl bg-[#121215] border border-zinc-800/80 flex items-center gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          class="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          placeholder="Cari nama pelanggan, nomor WhatsApp, atau kota..."
        />
      </div>
      <span class="text-xs text-zinc-400 font-mono">{{ filteredContacts.length }} Kontak Terdata</span>
    </div>

    <!-- Contacts Table -->
    <div class="rounded-3xl bg-[#121215] border border-zinc-800/80 overflow-hidden shadow-xl">
      <table class="w-full text-left text-xs text-zinc-300">
        <thead class="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
          <tr>
            <th class="p-4">Nama Pelanggan</th>
            <th class="p-4">Nomor WhatsApp</th>
            <th class="p-4">Kota</th>
            <th class="p-4">Tag Kategori</th>
            <th class="p-4">Tanggal Daftar</th>
            <th class="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/50">
          <tr v-for="c in filteredContacts" :key="c.id" class="hover:bg-zinc-800/30 transition-colors">
            <td class="p-4 font-semibold text-white flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                {{ c.name.charAt(0) }}
              </div>
              <div>
                <span>{{ c.name }}</span>
                <span v-if="c.isBlacklisted" class="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  BLACKLIST
                </span>
              </div>
            </td>
            <td class="p-4 font-mono text-zinc-300">{{ c.phoneNumber }}</td>
            <td class="p-4 text-zinc-400">{{ c.city || '-' }}</td>
            <td class="p-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="t in c.tags"
                  :key="t"
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                >
                  {{ t }}
                </span>
                <span v-if="!c.tags?.length" class="text-zinc-600">-</span>
              </div>
            </td>
            <td class="p-4 text-zinc-500 font-mono">{{ c.createdAt }}</td>
            <td class="p-4 text-right">
              <button
                @click="handleDeleteContact(c.id)"
                class="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Hapus Kontak"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah Kontak -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isAddModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>
        <h2 class="text-xl font-extrabold text-white">Tambah Kontak Baru</h2>
        <form @submit.prevent="handleAddContact" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nama Lengkap</label>
            <input v-model="formName" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="Budi Santoso" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nomor WhatsApp (E.164)</label>
            <input v-model="formPhone" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono" placeholder="+6281234567890" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Kota / Domisili</label>
            <input v-model="formCity" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="Jakarta Selatan" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Tag (Pisahkan dengan koma)</label>
            <input v-model="formTags" type="text" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="VIP, Buyer, Reseller" />
          </div>
          <div class="pt-3 flex justify-end gap-3">
            <button type="button" @click="isAddModalOpen = false" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Batal</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/25">Simpan Kontak</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Import CSV -->
    <div
      v-if="isImportModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isImportModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>
        <h2 class="text-xl font-extrabold text-white">Import Kontak CSV / Excel</h2>
        <p class="text-xs text-zinc-400 mt-1">Unggah file spreadsheet untuk memasukkan kontak massal ke antrean BullMQ.</p>

        <div class="mt-5 space-y-4">
          <div class="border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-2xl p-8 text-center cursor-pointer bg-zinc-950/60 transition-colors">
            <input type="file" accept=".csv, .xlsx, .xls" class="hidden" id="csvFileInput" @change="handleFileSelect" />
            <label for="csvFileInput" class="cursor-pointer flex flex-col items-center">
              <FileSpreadsheet class="w-12 h-12 text-orange-400 mb-3" />
              <p class="text-sm font-semibold text-zinc-200">
                {{ importFile ? importFile.name : 'Klik untuk pilih file CSV / Excel' }}
              </p>
              <p class="text-xs text-zinc-500 mt-1">Mendukung format .csv, .xlsx, atau .xls hingga 10MB</p>
            </label>
          </div>

          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
            <p class="font-bold text-zinc-300">Format Kolom Otomatis yang Terdeteksi:</p>
            <p>&bull; <code class="text-orange-400">nomor_wa / phone / no_hp</code> &rarr; Dinormalisasi ke +62 internasional</p>
            <p>&bull; <code class="text-orange-400">nama / full_name</code> &rarr; Nama penerima</p>
            <p>&bull; Kolom lain (Kota, OrderID) otomatis disimpan sebagai custom fields.</p>
          </div>

          <div class="pt-3 flex justify-end gap-3">
            <button type="button" @click="isImportModalOpen = false" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Batal</button>
            <button
              type="button"
              :disabled="!importFile || importUploading"
              @click="handleRunImport"
              class="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 disabled:opacity-50"
            >
              {{ importUploading ? 'Memproses Import...' : 'Mulai Proses Import' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
