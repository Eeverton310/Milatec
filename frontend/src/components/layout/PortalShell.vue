<template>
  <div class="shell" :class="`shell--${currentRole}`">
    <aside class="sidebar">
      <RouterLink :to="homeLink" class="sidebar__brand-card">
        <img :src="logo" alt="MilaTec" class="sidebar__brand-logo" />
        <div class="sidebar__brand-copy">
          <strong>MilaTec</strong>
        </div>
      </RouterLink>

      <nav class="sidebar__menu" aria-label="Navegação principal">
        <section v-for="group in currentMenuGroups" :key="group.label" class="sidebar__group">
          <p class="sidebar__group-label">{{ group.label }}</p>

          <div class="sidebar__group-items">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="resolveItemTarget(item)"
              class="sidebar__item"
              :class="{ 'sidebar__item--active': isActive(item.to) }"
            >
              <span class="sidebar__item-glow" />
              <span class="material-icons sidebar__item-icon" aria-hidden="true">{{ item.icon }}</span>
              <span class="sidebar__item-label">{{ item.label }}</span>
            </RouterLink>
          </div>
        </section>
      </nav>

      <div class="sidebar__footer">
        <button type="button" class="sidebar__logout" @click="onSignOut">
          Encerrar sessão
        </button>
      </div>
    </aside>

    <div class="shell__main">
      <header class="topbar">
        <div class="topbar__copy">
          <p v-if="topbarEyebrow" class="topbar__eyebrow">{{ topbarEyebrow }}</p>
          <h2 class="topbar__title">{{ currentTitle }}</h2>
        </div>

        <div class="topbar__profile">
          <div class="topbar__profile-copy">
            <strong>{{ currentProfile?.company }}</strong>
            <small>{{ currentProfile?.email }}</small>
          </div>
          <div class="topbar__avatar">{{ currentProfile?.initials }}</div>
        </div>
      </header>

      <main class="shell__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useSession } from '@/composables/useSession';
import logo from '@/assets/logo-milatec-BRtuGoQK.jpg (1).jpeg';

const route = useRoute();
const router = useRouter();
const { currentProfile, sessionRole, resolveDefaultRoute, signOut } = useSession();

const menuGroupsByRole = {
  client: [
    {
      label: 'Gestão',
      items: [{ label: 'Empresa', to: '/cliente/empresa', icon: 'domain' }],
    },
    {
      label: 'Operação',
      items: [
        { label: 'Obras', to: '/cliente/obras', icon: 'construction' },
        { label: 'Projetos', to: '/cliente/projetos', icon: 'account_tree' },
        { label: 'Programação de Entregas', to: '/cliente/entregas', icon: 'event_note' },
      ],
    },
    {
      label: 'Documentos',
      items: [{ label: 'Anexos', to: '/cliente/anexos', icon: 'folder_open' }],
    },
  ],
  admin: [
    {
      label: 'Gestão',
      items: [
        { label: 'Clientes', to: '/admin/clientes', icon: 'groups' },
        { label: 'Acessos', to: '/admin/acessos', icon: 'admin_panel_settings' },
      ],
    },
    {
      label: 'Operação',
      items: [
        { label: 'Obras', to: '/admin/obras', icon: 'construction' },
        { label: 'Projetos', to: '/admin/projetos', icon: 'account_tree' },
        { label: 'Entregas', to: '/admin/entregas', icon: 'local_shipping' },
      ],
    },
    {
      label: 'Documentos',
      items: [{ label: 'Anexos', to: '/admin/anexos', icon: 'folder_open' }],
    },
  ],
};

const currentRole = computed(() => sessionRole.value || 'client');
const currentMenuGroups = computed(() => menuGroupsByRole[currentRole.value] || menuGroupsByRole.client);
const currentMenu = computed(() => currentMenuGroups.value.flatMap((group) => group.items));
const currentTitle = computed(() => route.meta?.title || currentMenu.value[0]?.label || 'MilaTec');
const topbarEyebrow = computed(() => (currentRole.value === 'admin' ? 'Admin' : ''));
const homeLink = computed(() => resolveDefaultRoute(currentRole.value));

const isActive = (path) => route.path === path || route.path.startsWith(`${path}/`);

const resolveClientScopeQuery = () => {
  if (route.name === 'client-works' && typeof route.query.obraFiltro === 'string') {
    return { obraFiltro: route.query.obraFiltro };
  }

  if (route.name === 'client-projects' && typeof route.query.projetoFiltro === 'string') {
    return { projetoFiltro: route.query.projetoFiltro };
  }

  if (route.name === 'client-attachments') {
    const query = {};

    if (typeof route.query.obraFiltro === 'string') query.obraFiltro = route.query.obraFiltro;
    if (typeof route.query.projetoFiltro === 'string') query.projetoFiltro = route.query.projetoFiltro;

    return query;
  }

  return {};
};

const resolveItemTarget = (item) => {
  if (currentRole.value !== 'client') return item.to;

  const query = resolveClientScopeQuery();

  return Object.keys(query).length ? { path: item.to, query } : item.to;
};

const onSignOut = () => {
  signOut();
  router.push({ name: 'login' });
};
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr);
  background:
    radial-gradient(120% 120% at 100% 0%, rgba(0, 163, 74, 0.1), transparent 40%),
    linear-gradient(180deg, #f6f7f8 0%, #eef2ff 100%);
}

.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  padding: 16px 12px;
  overflow: hidden;
  background: linear-gradient(180deg, #050866 0%, #08118b 100%);
  color: #ffffff;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.shell--admin .sidebar {
  background: linear-gradient(180deg, #040545 0%, #050866 58%, #004ae8 100%);
}

.sidebar__brand-card {
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.16);
}

.sidebar__brand-logo {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 12px;
}

.sidebar__brand-copy strong {
  display: block;
}

.sidebar__brand-copy strong {
  font-size: 15px;
  line-height: 1.1;
}

.sidebar__menu {
  display: grid;
  align-content: start;
  gap: 22px;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 2px;
  scrollbar-width: thin;
}

.sidebar__group {
  display: grid;
  gap: 9px;
}

.sidebar__group-label {
  margin: 0;
  padding: 0 12px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  line-height: 1;
  text-transform: uppercase;
}

.sidebar__group-items {
  display: grid;
  gap: 7px;
}

.sidebar__item {
  position: relative;
  display: grid;
  grid-template-columns: 5px 38px 1fr;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 11px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.84);
  border: 1px solid transparent;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.sidebar__item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transform: translateY(-1px);
}

.sidebar__item--active {
  background: linear-gradient(135deg, rgba(0, 163, 74, 0.32), rgba(0, 74, 232, 0.36));
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 16px 32px rgba(0, 74, 232, 0.24);
}

.sidebar__item-glow {
  width: 5px;
  height: 24px;
  border-radius: 999px;
  background: transparent;
}

.sidebar__item--active .sidebar__item-glow {
  height: 30px;
  background: linear-gradient(180deg, #00a34a 0%, #004ae8 100%);
  box-shadow: 0 0 18px rgba(0, 163, 74, 0.65);
}

.sidebar__item-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(223, 234, 255, 0.94);
  font-size: 21px;
  line-height: 1;
  font-family: 'Material Icons';
  font-weight: 400;
  font-style: normal;
  user-select: none;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'liga';
}

.sidebar__item-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.15;
}

.sidebar__item--active .sidebar__item-label {
  font-weight: 800;
}

.sidebar__item--active .sidebar__item-icon {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16);
}

.sidebar__footer {
  display: grid;
  gap: 12px;
}

.sidebar__logout {
  min-height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.sidebar__logout:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.shell__main {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(5, 8, 102, 0.08);
  backdrop-filter: blur(14px);
}

.topbar__copy {
  display: grid;
  gap: 6px;
}

.topbar__eyebrow {
  margin: 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: #7a88a8;
  font-weight: 600;
}

.topbar__title {
  margin: 0;
  font-size: clamp(26px, 3vw, 34px);
  line-height: 1.08;
  color: #050866;
}

.topbar__profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 247, 252, 0.92));
  border: 1px solid rgba(5, 8, 102, 0.08);
  box-shadow: 0 12px 24px rgba(5, 8, 102, 0.08);
}

.topbar__profile-copy {
  text-align: right;
}

.topbar__profile-copy small {
  display: block;
}

.topbar__profile-copy strong {
  display: block;
  font-size: 15px;
  color: #050866;
}

.topbar__profile-copy small {
  margin-top: 2px;
  color: #6f7f9b;
}

.topbar__avatar {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #050866 0%, #004ae8 56%, #00a34a 100%);
  box-shadow: 0 14px 28px rgba(0, 74, 232, 0.24);
}

.shell--admin .topbar__avatar {
  background: linear-gradient(135deg, #040545 0%, #050866 50%, #004ae8 72%, #00a34a 100%);
}

.shell__content {
  display: flex;
  justify-content: center;
  padding: 22px 20px 32px;
}

.shell__content > * {
  width: 100%;
}

@media (max-width: 1080px) {
  .shell {
    grid-template-columns: 238px minmax(0, 1fr);
  }
}

@media (max-width: 880px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    align-self: stretch;
    grid-template-rows: auto auto auto;
    height: auto;
    max-height: none;
    padding: 14px 14px 12px;
    overflow: visible;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .sidebar__menu {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    overflow-y: visible;
    padding-bottom: 6px;
  }

  .sidebar__group {
    min-width: max-content;
  }

  .sidebar__group-items {
    grid-auto-flow: column;
    grid-auto-columns: minmax(132px, 1fr);
  }

  .sidebar__footer {
    justify-items: end;
  }

  .topbar {
    flex-direction: column;
    padding: 18px 18px 16px;
  }

  .shell__content {
    padding: 18px 14px 28px;
  }
}
</style>


