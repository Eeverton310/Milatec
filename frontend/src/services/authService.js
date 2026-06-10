import { api, setToken, clearToken } from './api';

/* POST /auth/login
   Solicita o envio do código OTP para o e-mail. */ 
export async function requestLoginCode(email) {
  return api.post('/auth/login', { email: email.trim().toLowerCase() });
}

/* POST /auth/verify
   Valida o código OTP e armazena o token JWT. */
export async function verifyLoginCode(email, code, role) {
  const response = await api.post('/auth/verify', {
    email: email.trim().toLowerCase(),
    code: code.trim(),
    role,
  });

  if (response?.access_token) {
    setToken(response.access_token);
  }

  return response;
}

// Limpa o token do armazenamento local.
export function logout() {
  clearToken();
}

/* GET /auth/me
  Retorna os dados do usuário autenticado (útil para validar sessão). */
export async function getCurrentUser() {
  return api.get('/auth/me');
}