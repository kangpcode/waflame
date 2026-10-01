import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref<Toast[]>([]);

  function show(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    toasts.value.push(newToast);

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  }

  function success(message: string, title = 'Berhasil') {
    show({ type: 'success', title, message });
  }

  function error(message: string, title = 'Terjadi Kesalahan') {
    show({ type: 'error', title, message });
  }

  function warning(message: string, title = 'Perhatian') {
    show({ type: 'warning', title, message });
  }

  function info(message: string, title = 'Informasi') {
    show({ type: 'info', title, message });
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    remove,
  };
});
