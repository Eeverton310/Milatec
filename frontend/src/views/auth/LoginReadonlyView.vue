<template>
  <section class="login-card">
    <div class="login__brand">
      <div class="brand-lockup">
        <img :src="logo" alt="MilaTec" class="brand-lockup__icon" />
        <div class="brand-lockup__copy">
          <strong>MilaTec</strong>
        </div>
      </div>
      <span class="badge">Acesso por perfil</span>
    </div>

    <header class="login__header">
      <p class="eyebrow">Portal MilaTec</p>
      <h1>Entre na área correta da MilaTec</h1>
      <p class="subtitle">
        Escolha o perfil, informe o e-mail autorizado e siga para a validação de acesso da área correta.
      </p>
    </header>

    <div class="login__roles" aria-label="Seleção de perfil">
      <button
        v-for="profile in profileOptions"
        :key="profile.role"
        type="button"
        class="login__role"
        :class="{ 'login__role--active': selectedRole === profile.role }"
        @click="selectProfile(profile)"
      >
        <strong>{{ profile.areaLabel }}</strong>
        <span>{{ profile.description }}</span>
      </button>
    </div>

    <form class="login__form" @submit.prevent="onSubmit">
      <BaseInput
        v-model="email"
        label="E-mail autorizado"
        type="email"
        placeholder="seuemail@empresa.com"
        tone="light"
      />

      <div class="login__summary">
        <span class="login__summary-pill">{{ selectedProfile.label }}</span>
        <p>{{ selectedProfile.description }}</p>
      </div>
      
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <BaseButton class="login__submit" size="lg" block>
        Receber código de acesso
      </BaseButton>

      <p class="helper">
        Cliente e administração possuem áreas separadas conforme o perfil autenticado.
      </p>
    </form>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import { profileOptions, requestAccessCode } from '@/composables/useSession';
import logo from '@/assets/logo-milatec-BRtuGoQK.jpg (1).jpeg';

const router = useRouter();

const selectedRole = ref('client');
const email = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const selectedProfile = computed(
  () => profileOptions.find((profile) => profile.role === selectedRole.value) || profileOptions[0],
);

const selectProfile = (profile) => {
  selectedRole.value = profile.role;
};

const onSubmit = async () => {
  errorMessage.value = '';

  const trimmedEmail = (email.value || '').trim();

  if (!trimmedEmail) {
    errorMessage.value = 'Informe um e-mail válido.';
    return;
  }

  try {
    isLoading.value = true;

    await requestAccessCode({ email: trimmedEmail });

    router.push({
      name: 'verify-code',
      query: {
        role: selectedRole.value,
        email: trimmedEmail,
      },
    });
  } catch (error) {
    errorMessage.value = error.message || 'Não foi possível enviar o código.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-card {
  width: min(540px, 94vw);
  padding: 34px 32px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f5;
  box-shadow: 0 26px 54px rgba(7, 17, 40, 0.24);
  display: grid;
  gap: 20px;
}

.login__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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

.badge,
.login__summary-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(0, 163, 74, 0.12);
  color: #00a34a;
  font-weight: 600;
  font-size: var(--fs-xs);
  border: 1px solid rgba(0, 168, 107, 0.28);
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6b7ea7;
  font-weight: 700;
}

.login__header h1 {
  margin: 6px 0;
  color: var(--text-strong);
  font-size: 30px;
}

.subtitle {
  margin: 0;
  color: #4a5672;
  line-height: 1.6;
}

.login__roles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.login__role {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid #d7deeb;
  background: #f7f9fc;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.login__role strong,
.login__role span {
  display: block;
}

.login__role strong {
  color: var(--text-strong);
}

.login__role span {
  margin-top: 6px;
  color: #627392;
  line-height: 1.5;
}

.login__role:hover,
.login__role--active {
  transform: translateY(-1px);
  border-color: rgba(0, 163, 74, 0.35);
  box-shadow: 0 16px 32px rgba(5, 8, 102, 0.08);
}

.login__role--active {
  background: linear-gradient(180deg, #f8fffc 0%, #eefbf5 100%);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login__summary {
  padding: 14px;
  border-radius: 18px;
  background: #f6f9ff;
  border: 1px solid #dbe5f4;
}

.login__summary p {
  margin-top: 8px;
  color: #4a5672;
}

.login__submit {
  margin-top: 6px;
  background: linear-gradient(135deg, #050866 0%, #004ae8 62%, #00a34a 100%);
  color: #ffffff;
  border: 1px solid rgba(5, 8, 102, 0.18);
  box-shadow: 0 12px 26px rgba(0, 74, 232, 0.2);
}

.helper {
  font-size: var(--fs-sm);
  color: #5b6b8c;
  line-height: 1.6;
  margin: 0;
  text-align: center;
}

@media (max-width: 720px) {
  .login-card {
    padding: 26px 22px;
  }

  .login__roles {
    grid-template-columns: 1fr;
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

