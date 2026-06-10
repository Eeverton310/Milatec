import { computed, ref } from 'vue';
import { getToken, clearToken } from '@/services/api';
import { requestLoginCode, verifyLoginCode } from '@/services/authService';

const STORAGE_KEY_ROLE = 'milatec:session-role';
const STORAGE_KEY_EMAIL = 'milatec:session-email';

const profileDirectory = Object.freeze({
  client: Object.freeze({
    role: 'client',
    label: 'Cliente',
    areaLabel: 'Área do Cliente',
    name: 'Cliente MilaTec',
    company: '',
    companyId: '',
    defaultEmail: '',
    initials: 'C',
    scopeLabel: 'Consulta somente leitura restrita a empresa, obras, projetos, entregas e anexos',
  }),
  admin: Object.freeze({
    role: 'admin',
    label: 'Administrador',
    areaLabel: 'Área Administrativa',
    name: 'Administrador',
    company: 'MilaTec',
    companyId: '',
    defaultEmail: '',
    initials: 'A',
    scopeLabel: 'Leitura operacional multiempresa com exposição mínima por perfil',
  }),
});

function readStorage(key) {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) || '';
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

// Considera autenticado quem tem token válido E role definido
const initialRole = readStorage(STORAGE_KEY_ROLE);
const initialEmail = readStorage(STORAGE_KEY_EMAIL);
const initialToken = getToken();

const sessionRole = ref(profileDirectory[initialRole] && initialToken ? initialRole : '');
const sessionEmail = ref(initialToken ? initialEmail : '');

export const profileOptions = Object.values(profileDirectory).map((profile) => ({
  role: profile.role,
  label: profile.label,
  areaLabel: profile.areaLabel,
  defaultEmail: profile.defaultEmail,
  description: profile.scopeLabel,
}));

export function getProfile(role = sessionRole.value, email = sessionEmail.value) {
  const baseProfile = profileDirectory[role];
  if (!baseProfile) return null;

  return {
    ...baseProfile,
    email: email || baseProfile.defaultEmail,
  };
}

export function canAccessRoles(roles, role = sessionRole.value) {
  if (!Array.isArray(roles) || roles.length === 0) return true;
  return roles.includes(role);
}

export function resolveDefaultRoute(role = sessionRole.value) {
  if (role === 'admin') return { name: 'admin-clients' };
  if (role === 'client') return { name: 'client-company' };
  return { name: 'login' };
}

/* Solicita o código OTP via backend.
   Não autentica ainda — apenas dispara o envio do e-mail. */
export async function requestAccessCode({ email }) {
  await requestLoginCode(email);
}

/* Valida o código OTP e finaliza o login com JWT.
   Após sucesso, atualiza o estado da sessão. */
export async function confirmAccessCode({ role, email, code }) {
  const nextRole = profileDirectory[role] ? role : 'client';

  const response = await verifyLoginCode(email, code, nextRole);
  const confirmedRole = response?.role === 'admin' ? 'admin' : nextRole;

  sessionRole.value = confirmedRole;
  sessionEmail.value = email;

  writeStorage(STORAGE_KEY_ROLE, confirmedRole);
  writeStorage(STORAGE_KEY_EMAIL, email);
}

/* Encerra a sessão: limpa token JWT e dados locais. */
export function signOut() {
  sessionRole.value = '';
  sessionEmail.value = '';

  writeStorage(STORAGE_KEY_ROLE, '');
  writeStorage(STORAGE_KEY_EMAIL, '');

  clearToken();
}

export function useSession() {
  const currentRole = computed(() => sessionRole.value);
  const currentProfile = computed(() => getProfile());

  return {
    sessionRole: currentRole,
    currentProfile,
    profileOptions,
    requestAccessCode,
    confirmAccessCode,
    signOut,
    resolveDefaultRoute,
    canAccessRoles,
  };
}

export { sessionRole };