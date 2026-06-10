/**
 * Cliente HTTP centralizado.
 *
 * Responsabilidades:
 * - Adicionar a URL base em todas as requisições
 * - Anexar o token JWT automaticamente quando existir
 * - Tratar erros de autenticação (401 -> redireciona para login)
 * - Padronizar a resposta como JSON
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_STORAGE_KEY = 'milatec:access-token';

// Lê o token JWT do localStorage.
 
export function getToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
}

// Salva o token JWT no localStorage.
export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

// Remove o token do localStorage.
 
export function clearToken() {
  setToken('');
}

// Função interna que faz a requisição HTTP. 
async function request(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token inválido ou expirado: limpa sessão e redireciona para login
  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // Erro do backend: tenta extrair mensagem amigável
  if (!response.ok) {
    let errorMessage = 'Erro ao se comunicar com o servidor.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Resposta sem JSON
    }
    throw new Error(errorMessage);
  }

  // Resposta sem corpo (ex: 204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};