<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import {
  ShieldCheck,
  Plus,
  User,
  Mail,
  Shield,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-vue-next';

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  roleCode: string;
  status: 'ACTIVE' | 'INVITED';
  joinedAt: string;
}

const auth = useAuthStore();
const notification = useNotificationStore();

const members = ref<MemberItem[]>([
  {
    id: 'm_1',
    name: 'Budi Santoso',
    email: 'owner@business.com',
    role: 'Owner / Tenant Admin',
    roleCode: 'ADMIN',
    status: 'ACTIVE',
    joinedAt: '2026-08-01',
  },
  {
    id: 'm_2',
    name: 'Siti Rahma',
    email: 'siti.cs@business.com',
    role: 'Customer Service Agent',
    roleCode: 'AGENT',
    status: 'ACTIVE',
    joinedAt: '2026-08-15',
  },
  {
    id: 'm_3',
    name: 'Ahmad Fauzi',
    email: 'ahmad.manager@business.com',
    role: 'Campaign Manager',
    roleCode: 'MANAGER',
    status: 'ACTIVE',
    joinedAt: '2026-09-01',
  },
]);

const isAddModalOpen = ref(false);
const formName = ref('');
const formEmail = ref('');
const formRole = ref('AGENT');

function handleInviteMember() {
  if (!formName.value || !formEmail.value) {
    notification.warning('Nama dan email wajib diisi');
    return;
  }

  const roleNameMap: Record<string, string> = {
    ADMIN: 'Admin / Owner',
    MANAGER: 'Campaign Manager',
    AGENT: 'Customer Service Agent',
  };

  members.value.push({
    id: 'm_' + Date.now(),
    name: formName.value,
    email: formEmail.value,
    role: roleNameMap[formRole.value] || 'Member',
    roleCode: formRole.value,
    status: 'INVITED',
    joinedAt: 'Baru saja',
  });

  notification.success(`Undangan tim telah dikirimkan ke email ${formEmail.value}!`);
  isAddModalOpen.value = false;
  formName.value = '';
  formEmail.value = '';
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">Tim & Hak Akses (RBAC)</h1>
        <p class="text-sm text-zinc-400 mt-1">Kelola anggota workspace dan hak akses berbasis role (Super Admin, Owner, Manager, CS Agent).</p>
      </div>

      <button
        @click="isAddModalOpen = true"
        class="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 flex items-center gap-2 self-start"
      >
        <Plus class="w-4 h-4" />
        <span>Undang Anggota Tim</span>
      </button>
    </div>

    <!-- Members Table -->
    <div class="rounded-3xl bg-[#121215] border border-zinc-800/80 overflow-hidden shadow-xl">
      <table class="w-full text-left text-xs text-zinc-300">
        <thead class="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
          <tr>
            <th class="p-4">Nama Anggota</th>
            <th class="p-4">Email</th>
            <th class="p-4">Role Akses</th>
            <th class="p-4">Status</th>
            <th class="p-4">Bergabung</th>
            <th class="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/50">
          <tr v-for="m in members" :key="m.id" class="hover:bg-zinc-800/30 transition-colors">
            <td class="p-4 font-semibold text-white flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs">
                {{ m.name.charAt(0) }}
              </div>
              <span>{{ m.name }}</span>
            </td>
            <td class="p-4 font-mono text-zinc-400">{{ m.email }}</td>
            <td class="p-4">
              <span
                class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                :class="{
                  'bg-orange-500/10 text-orange-400 border-orange-500/30': m.roleCode === 'ADMIN',
                  'bg-blue-500/10 text-blue-400 border-blue-500/30': m.roleCode === 'MANAGER',
                  'bg-purple-500/10 text-purple-400 border-purple-500/30': m.roleCode === 'AGENT',
                }"
              >
                {{ m.role }}
              </span>
            </td>
            <td class="p-4">
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold"
                :class="m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'"
              >
                {{ m.status }}
              </span>
            </td>
            <td class="p-4 text-zinc-500 font-mono">{{ m.joinedAt }}</td>
            <td class="p-4 text-right">
              <button class="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Undang Anggota -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 relative">
        <button @click="isAddModalOpen = false" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg">
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-xl font-extrabold text-white">Undang Anggota Tim Baru</h2>
        <form @submit.prevent="handleInviteMember" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nama Lengkap</label>
            <input v-model="formName" type="text" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="Ahmad CS" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Email Pengguna</label>
            <input v-model="formEmail" type="email" required class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100" placeholder="ahmad@perusahaan.com" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Role & Hak Akses</label>
            <select v-model="formRole" class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100">
              <option value="AGENT">Customer Service Agent (Akses Live Chat & Kontak)</option>
              <option value="MANAGER">Campaign Manager (Akses Broadcast, Kontak, & Laporan)</option>
              <option value="ADMIN">Tenant Admin / Owner (Akses Penuh Kelola Workspace)</option>
            </select>
          </div>

          <div class="pt-3 flex justify-end gap-3">
            <button type="button" @click="isAddModalOpen = false" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Batal</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/25">Kirim Undangan</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
