<template>
  <label class="field" :class="[tone, { error }]">
    <span v-if="label" class="field__label">{{ label }}</span>
    <div class="field__control">
      <select class="select" :value="modelValue" v-bind="$attrs" @change="updateValue">
        <option v-for="option in normalizedOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="material-icons field__icon" aria-hidden="true">expand_more</span>
    </div>
    <small v-if="helper && !error" class="helper">{{ helper }}</small>
    <small v-if="error" class="helper helper--error">{{ error }}</small>
  </label>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  helper: { type: String, default: '' },
  error: { type: String, default: '' },
  tone: { type: String, default: 'dark' }, // dark | light
  options: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const normalizedOptions = computed(() =>
  props.options.map((option) => {
    if (typeof option === 'object') return option;
    return { label: option, value: option };
  }),
);

const updateValue = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--fs-sm);
}

.field__label {
  font-weight: 600;
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.select {
  flex: 1;
  min-width: 0;
  padding-right: 24px;
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--fs-md);
  font-family: var(--font-family);
  cursor: pointer;
}

.field__icon {
  position: absolute;
  right: 10px;
  font-size: 18px;
  pointer-events: none;
}

.field.dark {
  color: var(--text);
}

.field.dark .field__label {
  color: var(--text-strong);
}

.field.dark .field__control {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--stroke);
}

.field.dark .select,
.field.dark .field__icon {
  color: var(--text);
}

.field.dark:hover .field__control {
  border-color: rgba(255, 255, 255, 0.18);
}

.field.dark:focus-within .field__control {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(46, 211, 160, 0.25);
}

.field.light {
  color: #1f2a44;
}

.field.light .field__label {
  color: var(--text-strong);
}

.field.light .field__control {
  background: var(--gray-50);
  border: 1px solid #d3dbeb;
}

.field.light .select,
.field.light .field__icon {
  color: var(--text-strong);
}

.field.light:hover .field__control {
  border-color: #b6c4dc;
}

.field.light:focus-within .field__control {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 163, 74, 0.18);
}

.helper {
  color: var(--muted);
}

.helper--error {
  color: #ff8a7a;
}

.field.error .field__control {
  border-color: #ff8a7a;
}
</style>
