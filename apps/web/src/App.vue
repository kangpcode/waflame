<script setup lang="ts">
import ToastContainer from './components/common/ToastContainer.vue';
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-[#f4f4f5]">
    <router-view />
    <ToastContainer />
  </div>
</template>
