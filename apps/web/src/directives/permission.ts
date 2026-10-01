import { Directive } from 'vue';
import { useAuthStore } from '../stores/auth.js';

export const canDirective: Directive = {
  mounted(el, binding) {
    const authStore = useAuthStore();
    const requiredPermission = binding.value;

    if (!requiredPermission) return;

    const allowed = authStore.hasPermission(requiredPermission);
    if (!allowed) {
      if (binding.modifiers.disable) {
        el.disabled = true;
        el.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
      } else {
        el.parentNode?.removeChild(el);
      }
    }
  },
  updated(el, binding) {
    const authStore = useAuthStore();
    const requiredPermission = binding.value;

    if (!requiredPermission) return;

    const allowed = authStore.hasPermission(requiredPermission);
    if (!allowed && !binding.modifiers.disable) {
      el.parentNode?.removeChild(el);
    }
  },
};
