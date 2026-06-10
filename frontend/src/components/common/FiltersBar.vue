<template>
  <section class="filters-bar" aria-label="Filtros da visualização">
    <div class="filters-bar__controls">
      <slot />
    </div>

    <div class="filters-bar__footer">
      <p class="filters-bar__summary">{{ summaryText }}</p>

      <button v-if="showClear" type="button" class="filters-bar__clear" @click="$emit('clear')">
        Limpar filtros
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  label: { type: String, default: 'itens' },
  showClear: { type: Boolean, default: false },
});

defineEmits(['clear']);

const summaryText = computed(() => {
  if (!props.total || props.count === props.total) {
    return `${props.count} ${props.label}`;
  }

  return `${props.count} de ${props.total} ${props.label}`;
});
</script>

<style scoped>
.filters-bar {
  display: grid;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid var(--stroke-soft);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 24px rgba(5, 8, 102, 0.06);
}

.filters-bar__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.filters-bar__controls :deep(.field) {
  min-width: 0;
}

.filters-bar__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filters-bar__summary {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.filters-bar__clear {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(0, 74, 232, 0.16);
  border-radius: 999px;
  background: rgba(0, 74, 232, 0.06);
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.filters-bar__clear:hover,
.filters-bar__clear:focus-visible {
  background: rgba(0, 74, 232, 0.1);
  border-color: rgba(0, 74, 232, 0.24);
  transform: translateY(-1px);
  outline: none;
}
</style>
