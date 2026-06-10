<template>
  <component :is="layoutComponent">
    <RouterView />
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import AppShell from './components/layout/PortalShell.vue';
import AuthShell from './components/layout/AuthShell.vue';

const route = useRoute();

const layoutComponent = computed(() => {
  if (route.meta?.layout === 'auth') return AuthShell;
  return AppShell;
});
</script>
