<template>
  <button
    class="btn"
    :class="[variant, size, { block }]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary', // primary | ghost | subtle
  },
  size: {
    type: String,
    default: 'md', // sm | md | lg
  },
  block: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  color: var(--text-strong);
  background: var(--primary);
  box-shadow: var(--shadow-sm);
}

.btn.primary {
  background: linear-gradient(135deg, var(--blue-700), var(--blue-900));
  border-color: rgba(0, 0, 0, 0.06);
  color: var(--white);
}

.btn.ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--stroke);
  box-shadow: none;
}

.btn.subtle {
  background: var(--gray-100);
  color: var(--text);
  border-color: #d9deea;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn.sm {
  padding: 7px 12px;
  font-size: 13px;
}

.btn.md {
  padding: 10px 14px;
  font-size: 14px;
}

.btn.lg {
  padding: 12px 16px;
  font-size: 15px;
}

.btn.block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
