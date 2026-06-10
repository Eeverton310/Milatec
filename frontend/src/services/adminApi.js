import { api } from './api';

export async function getAdminDashboard() {
  return api.get('/admin/dashboard');
}

export async function getAdminProjects() {
  return api.get('/admin/projects');
}

export async function getAdminCompanies() {
  return api.get('/admin/companies');
}

export async function getAdminUsers() {
  return api.get('/admin/users');
}
