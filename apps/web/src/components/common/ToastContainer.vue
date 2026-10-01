<script setup lang="ts">
import { useNotificationStore } from '../../stores/notification.js';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-vue-next';

const notification = useNotificationStore();
</script>

<template>
  <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
    <transition-group
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in notification.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all"
        :class="{
          'bg-zinc-900/90 border-emerald-500/30 text-emerald-300': toast.type === 'success',
          'bg-zinc-900/90 border-rose-500/30 text-rose-300': toast.type === 'error',
          'bg-zinc-900/90 border-amber-500/30 text-amber-300': toast.type === 'warning',
          'bg-zinc-900/90 border-orange-500/30 text-orange-300': toast.type === 'info',
        }"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <Info v-else class="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />

        <div class="flex-1 text-sm">
          <p v-if="toast.title" class="font-semibold text-white tracking-wide mb-0.5">{{ toast.title }}</p>
          <p class="text-zinc-300 leading-snug">{{ toast.message }}</p>
        </div>

        <button
          @click="notification.remove(toast.id)"
          class="text-zinc-400 hover:text-white transition-colors p-1 rounded-md"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
