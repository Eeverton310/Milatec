import { api } from './api';

/* Busca todos os dados do dashboard do cliente em uma única chamada.
   Retorna a estrutura consolidada que vem do GET /dashboard. */
export async function fetchDashboard() {
  return api.get('/dashboard');
}

// Busca a lista completa de orçamentos da empresa.

export async function fetchBudgets() {
  return api.get('/budgets');
}

// Busca a lista de projetos da empresa.
 
export async function fetchProjects() {
  return api.get('/projects');
}

// Busca a lista de entregas da empresa.

export async function fetchDeliveries() {
  return api.get('/deliveries');
}

// Busca a lista de instalações (obras) da empresa.
 
export async function fetchInstallations() {
  return api.get('/installations');
}

// Busca a lista de documentos disponíveis. 
export async function fetchDocuments() {
  return api.get('/documents');
}