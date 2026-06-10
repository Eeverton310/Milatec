import { createRouter, createWebHistory } from 'vue-router';
import { canAccessRoles, resolveDefaultRoute, sessionRole } from '@/composables/useSession';
import LoginView from '@/views/auth/LoginReadonlyView.vue';
import VerifyAccessView from '@/views/auth/VerifyAccessView.vue';
import ClientCompanyView from '@/views/client/ClientCompanyView.vue';
import ClientWorksView from '@/views/client/ClientWorksView.vue';
import ClientProjectsView from '@/views/client/ClientProjectsTableView.vue';
import ClientDeliveriesView from '@/views/client/ClientDeliveriesTableView.vue';
import ClientAttachmentsView from '@/views/client/ClientAttachmentsView.vue';
import AdminClientsView from '@/views/admin/AdminClientsScopeView.vue';
import AdminWorksView from '@/views/admin/AdminWorksView.vue';
import AdminProjectsView from '@/views/admin/AdminProjectsView.vue';
import AdminDeliveriesView from '@/views/admin/AdminDeliveriesView.vue';
import AdminAttachmentsView from '@/views/admin/AdminAttachmentsView.vue';
import AdminAccessView from '@/views/admin/AdminAccessControlView.vue';

const routes = [
  {
    path: '/',
    redirect: () => resolveDefaultRoute(),
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { layout: 'auth', guestOnly: true, title: 'Acesso MilaTec' },
  },
  {
    path: '/verificar-codigo',
    name: 'verify-code',
    component: VerifyAccessView,
    meta: { layout: 'auth', guestOnly: true, title: 'Verificação de acesso' },
  },
  {
    path: '/cliente',
    redirect: { name: 'client-company' },
  },
  {
    path: '/cliente/empresa',
    name: 'client-company',
    component: ClientCompanyView,
    meta: { requiresAuth: true, roles: ['client'], title: 'Empresa' },
  },
  {
    path: '/cliente/obras',
    name: 'client-works',
    component: ClientWorksView,
    meta: { requiresAuth: true, roles: ['client'], title: 'Obras' },
  },
  {
    path: '/cliente/projetos',
    name: 'client-projects',
    component: ClientProjectsView,
    meta: { requiresAuth: true, roles: ['client'], title: 'Projetos' },
  },
  {
    path: '/cliente/entregas',
    name: 'client-deliveries',
    component: ClientDeliveriesView,
    meta: { requiresAuth: true, roles: ['client'], title: 'Programação de Entregas' },
  },
  {
    path: '/cliente/anexos',
    name: 'client-attachments',
    component: ClientAttachmentsView,
    meta: { requiresAuth: true, roles: ['client'], title: 'Anexos' },
  },
  {
    path: '/admin',
    redirect: { name: 'admin-clients' },
  },
  {
    path: '/admin/clientes',
    name: 'admin-clients',
    component: AdminClientsView,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Clientes' },
  },
  {
    path: '/admin/obras',
    name: 'admin-works',
    component: AdminWorksView,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Obras' },
  },
  {
    path: '/admin/projetos',
    name: 'admin-projects',
    component: AdminProjectsView,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Projetos' },
  },
  {
    path: '/admin/entregas',
    name: 'admin-deliveries',
    component: AdminDeliveriesView,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Entregas' },
  },
  {
    path: '/admin/anexos',
    name: 'admin-attachments',
    component: AdminAttachmentsView,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Anexos' },
  },
  {
    path: '/admin/acessos',
    name: 'admin-access',
    component: AdminAccessView,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Acessos' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: () => resolveDefaultRoute(sessionRole.value),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const activeRole = sessionRole.value;

  if (to.meta?.guestOnly && activeRole) {
    return resolveDefaultRoute(activeRole);
  }

  if (to.meta?.requiresAuth && !activeRole) {
    return { name: 'login' };
  }

  if (to.meta?.roles && !canAccessRoles(to.meta.roles, activeRole)) {
    return activeRole ? resolveDefaultRoute(activeRole) : { name: 'login' };
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title} | MilaTec` : 'MilaTec';
});

export default router;

