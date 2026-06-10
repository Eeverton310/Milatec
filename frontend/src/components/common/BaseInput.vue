<template>
  <label class="field" :class="[tone, { error }]">
    <span class="field__label" v-if="label">{{ label }}</span>
    <div class="field__control">
      <slot name="prefix" />
      <input
        class="input"
        :type="type"
        :placeholder="placeholder"
        v-model="localValue"
        v-bind="$attrs"
      />
      <slot name="suffix" />
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
  placeholder: { type: String, default: '' },
  helper: { type: String, default: '' },
  error: { type: String, default: '' },
  type: { type: String, default: 'text' },
  tone: { type: String, default: 'dark' }, // dark | light
});

const emit = defineEmits(['update:modelValue']);

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
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
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--fs-md);
  font-family: var(--font-family);
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

.field.dark .input {
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

.field.light .input {
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
