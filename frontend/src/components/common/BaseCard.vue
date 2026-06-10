<template>
  <section class="card" :class="variant">
    <header v-if="$slots.header" class="card__header">
      <slot name="header" />
    </header>
    <div class="card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'elevated', // elevated | flat | outline
  },
});
</script>

<style scoped>
.card {
  background: var(--card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--stroke-soft);
  box-shadow: var(--shadow-md);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card.flat {
  box-shadow: none;
  background: rgba(255, 255, 255, 0.74);
}

.card.outline {
  box-shadow: none;
  border: 1px dashed var(--stroke);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card__footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
