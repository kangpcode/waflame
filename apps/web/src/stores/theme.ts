import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(true);

  // Initialize theme from localStorage or system preference
  const saved = localStorage.getItem('waflame_theme');
  if (saved) {
    isDark.value = saved === 'dark';
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme();

  function toggle() {
    isDark.value = !isDark.value;
    localStorage.setItem('waflame_theme', isDark.value ? 'dark' : 'light');
    applyTheme();
  }

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }

  return {
    isDark,
    toggle,
  };
});
