<template>
  <div class="auth-shell">
    <div class="auth-shell__pattern"></div>
    <div class="auth-shell__grid">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  position: relative;
  background: radial-gradient(140% 140% at 15% 20%, rgba(0, 163, 74, 0.14), transparent 45%),
    linear-gradient(135deg, #050866 0%, #0632b0 54%, #004ae8 100%);
  overflow: hidden;
}

.auth-shell__pattern {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.06), transparent 65%);
  opacity: 0.22;
  pointer-events: none;
}

.auth-shell__grid {
  position: relative;
  width: min(440px, 92vw);
}

@media (max-width: 720px) {
  .auth-shell {
    padding: var(--space-6) var(--space-4);
  }

  .auth-shell__grid {
    gap: var(--space-4);
  }
}
</style>
