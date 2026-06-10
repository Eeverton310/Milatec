<template>
  <section class="verify">
    <div class="verify__brand">
      <div class="brand-lockup">
        <img :src="logo" alt="MilaTec" class="brand-lockup__icon" />
        <div class="brand-lockup__copy">
          <strong>MilaTec</strong>
        </div>
      </div>
      <p class="pill">Validação de perfil</p>
    </div>

    <div class="verify__content">
      <header>
        <p class="eyebrow">Confirmacao de acesso</p>
        <h1>Confirme o código e entre na área correta</h1>
        <p class="subtitle">
          Confirme o código para acessar sua área e continuar com o perfil selecionado.
        </p>
      </header>

      <div class="verify__identity">
        <span class="verify__identity-pill">{{ selectedProfile.areaLabel }}</span>
        <strong>{{ requestedEmail }}</strong>
        <p>{{ selectedProfile.description }}</p>
      </div>

      <form class="verify__form" @submit.prevent="onSubmit">
        <BaseInput
          v-model="code"
          label="Código de validação"
          placeholder="000000"
          maxlength="6"
          inputmode="numeric"
          pattern="[0-9]*"
          tone="light"
          class="code-input"
        />
        
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <BaseButton size="lg" block>
          Entrar na plataforma
        </BaseButton>

        <div class="actions">
          <BaseButton variant="ghost" size="sm" @click.prevent="onResend">
            Reenviar código
          </BaseButton>
          <RouterLink to="/login" class="back-link">Voltar</RouterLink>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import {
  profileOptions,
  resolveDefaultRoute,
  confirmAccessCode,
  requestAccessCode,
} from '@/composables/useSession';
import logo from '@/assets/logo-milatec-BRtuGoQK.jpg (1).jpeg';

const route = useRoute();
const router = useRouter();
const code = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const requestedRole = computed(() => (route.query.role === 'admin' ? 'admin' : 'client'));
const selectedProfile = computed(
  () => profileOptions.find((profile) => profile.role === requestedRole.value) || profileOptions[0],
);
const requestedEmail = computed(() => {
  const email = typeof route.query.email === 'string' ? route.query.email : '';
  return email || selectedProfile.value.defaultEmail;
});

const onSubmit = async () => {
  errorMessage.value = '';

  if (!code.value || code.value.length !== 6) {
    errorMessage.value = 'Informe o código de 6 dígitos.';
    return;
  }

  try {
    isLoading.value = true;

    await confirmAccessCode({
      role: requestedRole.value,
      email: requestedEmail.value,
      code: code.value,
    });

    router.push(resolveDefaultRoute(requestedRole.value));
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível validar o código.';
  } finally {
    isLoading.value = false;
  }
};

const onResend = async () => {
  errorMessage.value = '';
  code.value = '';

  try {
    isLoading.value = true;
    await requestAccessCode({ email: requestedEmail.value });
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível reenviar o código.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.verify {
  padding: 30px 28px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e5eaf3;
  box-shadow: 0 16px 36px rgba(12, 26, 58, 0.18);
}

.verify__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.brand-lockup {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f7faff 0%, #eef4ff 100%);
  border: 1px solid #dbe5f4;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.brand-lockup__icon {
  width: 58px;
  height: 58px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 14px 26px rgba(5, 8, 102, 0.18);
}

.brand-lockup__copy strong {
  display: block;
  color: #050866;
  font-size: 30px;
  line-height: 1;
  letter-spacing: -0.02em;
}

.verify__content {
  color: #102347;
}

.eyebrow {
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5b6b8c;
  margin-bottom: 6px;
  font-weight: 700;
}

h1 {
  color: var(--text-strong);
  margin-bottom: 8px;
}

.subtitle {
  color: #4a5672;
  font-size: var(--fs-md);
  line-height: 1.6;
}

.verify__identity {
  margin-top: var(--space-4);
  padding: 16px;
  border-radius: 18px;
  background: #f6f9ff;
  border: 1px solid #dbe5f4;
}

.verify__identity-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(0, 163, 74, 0.12);
  color: #00a34a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.verify__identity strong {
  display: block;
  margin-top: 10px;
  color: var(--text-strong);
}

.verify__identity p {
  margin-top: 6px;
}

.verify__form {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.code-input :deep(.input) {
  letter-spacing: 12px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.back-link {
  color: var(--primary);
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .verify {
    padding: var(--space-5);
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}

.error-message {
  color: #c0392b;
  background: #fdecea;
  border: 1px solid #f5c6cb;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  margin: 0;
}
</style>

