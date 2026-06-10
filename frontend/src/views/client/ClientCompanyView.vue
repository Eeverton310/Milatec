<template>
  <div class="page page--wide">
    <div v-if="isLoading" class="page-status page-status--loading">
      <span class="loader" aria-hidden="true"></span>
      <p>Carregando dados da sua empresa...</p>
    </div>

    <div v-else-if="error" class="page-status page-status--error">
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <section class="company-hero">
        <div class="company-hero__copy">
          <p class="pill">Empresa</p>
          <h3>{{ company.name }}</h3>
          <p>
            Painel somente leitura para acompanhar obras, projetos, entregas e documentos liberados
            para esta empresa.
          </p>
        </div>

        <dl class="company-hero__details" aria-label="Dados principais da empresa">
          <div>
            <dt>Cidade e estado</dt>
            <dd>{{ company.cityState }}</dd>
          </div>
          <div>
            <dt>Contato principal</dt>
            <dd>{{ company.primaryContact }}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{{ company.primaryEmail }}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{{ company.primaryPhone }}</dd>
          </div>
        </dl>
      </section>

      <section class="metric-grid" aria-label="Resumo da empresa">
        <BaseCard v-for="card in dashboardCards" :key="card.label" class="metric-card">
          <p class="pill">{{ card.label }}</p>
          <strong class="metric-card__value" :style="{ color: card.accent }">{{ card.value }}</strong>
          <p>{{ card.detail }}</p>
        </BaseCard>
      </section>

      <section class="dashboard-grid">
        <BaseCard class="company-summary-card">
          <template #header>
            <div class="section-heading">
              <p class="pill">Empresa</p>
              <h3>Dados principais</h3>
            </div>
          </template>

          <div class="company-info-grid">
            <article v-for="item in companyDetailCards" :key="item.label" class="company-info-card">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small v-if="item.helper">{{ item.helper }}</small>
            </article>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <div class="section-heading">
              <p class="pill">Acompanhamento</p>
              <h3>Resumo operacional</h3>
            </div>
          </template>

          <div
            class="expandable-panel expandable-panel--overview"
            :class="{ 'expandable-panel--expanded': isOverviewExpanded }"
          >
            <div class="overview-list">
              <section v-for="group in operationalOverview" :key="group.label" class="overview-group">
                <header>
                  <span>{{ group.label }}</span>
                  <strong>{{ group.total }}</strong>
                </header>

                <div v-if="group.rows.length" class="overview-group__rows">
                  <div v-for="row in group.rows" :key="`${group.label}-${row.label}`" class="overview-row">
                    <div>
                      <span>{{ row.label }}</span>
                      <strong>{{ row.count }}</strong>
                    </div>
                    <span class="overview-row__bar" aria-hidden="true">
                      <span :style="{ width: `${row.percentage}%` }" />
                    </span>
                  </div>
                </div>

                <p v-else class="empty-state">Nenhum registro disponível.</p>
              </section>
            </div>
          </div>

          <button
            type="button"
            class="card-toggle"
            :aria-expanded="isOverviewExpanded"
            @click="isOverviewExpanded = !isOverviewExpanded"
          >
            {{ isOverviewExpanded ? 'Mostrar menos' : 'Ler mais' }}
          </button>
        </BaseCard>
      </section>

      <section class="dashboard-columns">
        <BaseCard>
          <template #header>
            <div class="section-heading">
              <p class="pill">Obras</p>
              <h3>Obras em acompanhamento</h3>
            </div>
          </template>

          <div class="work-grid">
            <article v-for="work in workHighlights" :key="work.id" class="content-card content-card--work">
              <div class="content-card__header">
                <div>
                  <strong>{{ work.name }}</strong>
                  <p>{{ work.city }} · {{ work.budgetType }}</p>
                </div>
                <span class="status-badge status-badge--info">{{ work.stage }}</span>
              </div>

              <div class="content-card__meta">
                <span class="info-chip">{{ work.linkedProjects.length }} projetos</span>
                <span class="info-chip">{{ work.linkedDeliveries.length }} entregas</span>
              </div>
            </article>

            <p v-if="!workHighlights.length" class="empty-state">Nenhuma obra liberada para esta empresa.</p>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <div class="section-heading">
              <p class="pill">Entregas</p>
              <h3>Próximas entregas</h3>
            </div>
          </template>

          <div class="timeline-grid">
            <article v-for="delivery in nextDeliveries" :key="delivery.id" class="content-card content-card--delivery">
              <time>{{ delivery.displayDate }}</time>
              <div>
                <strong>{{ delivery.name }}</strong>
                <p>{{ delivery.workName }} · {{ delivery.quantity }}</p>
                <span>{{ delivery.deliveryAddress }}</span>
              </div>
            </article>

            <p v-if="!nextDeliveries.length" class="empty-state">Nenhuma entrega com data programada.</p>
          </div>
        </BaseCard>
      </section>

      <section class="dashboard-columns">
        <BaseCard>
          <template #header>
            <div class="section-heading">
              <p class="pill">Projetos</p>
              <h3>Projetos visíveis</h3>
            </div>
          </template>

          <div class="project-grid">
            <article v-for="project in projectHighlights" :key="project.id" class="content-card content-card--project">
              <div class="content-card__header">
                <div>
                  <strong>{{ project.name }}</strong>
                  <p>{{ project.workName }} · {{ project.product }}</p>
                </div>
                <span class="status-badge status-badge--document">{{ project.stage }}</span>
              </div>

              <div class="content-card__meta">
                <span class="info-chip">{{ project.quantity }}</span>
                <span class="info-chip">{{ project.totalValue }}</span>
              </div>
            </article>

            <p v-if="!projectHighlights.length" class="empty-state">Nenhum projeto liberado para consulta.</p>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <div class="section-heading">
              <p class="pill">Documentos</p>
              <h3>Últimos anexos liberados</h3>
            </div>
          </template>

          <div class="document-grid">
            <article v-for="attachment in recentAttachments" :key="attachment.id" class="content-card content-card--document">
              <div class="content-card__header">
                <div>
                  <strong>{{ attachment.name }}</strong>
                  <p>{{ attachment.linkedTypeLabel }} · {{ attachment.linkedRecordName }}</p>
                </div>
                <span class="info-chip info-chip--blue">{{ attachment.category }}</span>
              </div>

              <div class="content-card__meta">
                <span class="info-chip">{{ attachment.uploadedAt }}</span>
              </div>
            </article>

            <p v-if="!recentAttachments.length" class="empty-state">Nenhum anexo liberado para consulta.</p>
          </div>
        </BaseCard>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import BaseCard from '@/components/common/BaseCard.vue';
import { useClientPortalData } from '@/composables/useClientPortalData';

const { portalData, isLoading, error } = useClientPortalData();
const isOverviewExpanded = ref(false);

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const company = computed(() => portalData.value.company);
const works = computed(() => portalData.value.works || []);
const budgets = computed(() => portalData.value.budgets || []);
const projects = computed(() => portalData.value.projects || []);
const deliveries = computed(() => portalData.value.deliveries || []);
const attachments = computed(() => portalData.value.attachments || []);

const activeBudgets = computed(() => budgets.value.filter((budget) => budget.active));
const inProgressProjects = computed(() => projects.value.filter((project) => project.inProgress));
const scheduledDeliveries = computed(() => deliveries.value.filter((delivery) => delivery.hasDate));
const pendingDeliveries = computed(() => deliveries.value.filter((delivery) => !delivery.hasDate));
const totalProjectValue = computed(() =>
  projects.value.reduce((total, project) => total + parseCurrency(project.totalValue), 0),
);

const dashboardCards = computed(() => [
  {
    label: 'Obras',
    value: String(works.value.length),
    detail: `${projects.value.length} projetos vinculados`,
    accent: '#004AE8',
  },
  {
    label: 'Orçamentos ativos',
    value: String(activeBudgets.value.length),
    detail: `${budgets.value.length} orçamentos liberados para consulta`,
    accent: '#050866',
  },
  {
    label: 'Entregas programadas',
    value: String(scheduledDeliveries.value.length),
    detail: `${pendingDeliveries.value.length} entregas aguardando data`,
    accent: '#00A34A',
  },
  {
    label: 'Valor acompanhado',
    value: currencyFormatter.format(totalProjectValue.value),
    detail: 'Soma dos projetos visíveis para a empresa',
    accent: '#B7791F',
  },
]);

const companyDetailCards = computed(() => [
  {
    label: 'Nome da empresa',
    value: company.value.name,
    helper: 'Conta vinculada ao portal',
  },
  {
    label: 'Cidade e estado',
    value: company.value.cityState,
    helper: 'Base operacional principal',
  },
  {
    label: 'Contato principal',
    value: company.value.primaryContact,
    helper: 'Responsável cadastrado',
  },
  {
    label: 'E-mail',
    value: company.value.primaryEmail,
    helper: 'Canal principal de comunicação',
  },
  {
    label: 'Telefone',
    value: company.value.primaryPhone,
    helper: 'Contato validado para atendimento',
  },
]);

const operationalOverview = computed(() => [
  {
    label: 'Obras por etapa',
    total: works.value.length,
    rows: summarizeBy(works.value, (work) => work.stage),
  },
  {
    label: 'Projetos por etapa',
    total: projects.value.length,
    rows: summarizeBy(projects.value, (project) => project.stage),
  },
  {
    label: 'Entregas por status',
    total: deliveries.value.length,
    rows: summarizeBy(deliveries.value, (delivery) => delivery.status),
  },
]);

const workHighlights = computed(() => works.value.slice(0, 5));

const nextDeliveries = computed(() => {
  const datedDeliveries = deliveries.value
    .filter((delivery) => delivery.hasDate && normalizeText(delivery.status) !== 'entregue')
    .sort((a, b) => dateTime(a.displayDate) - dateTime(b.displayDate));
  const upcomingDeliveries = datedDeliveries.filter((delivery) => dateTime(delivery.displayDate) >= todayTime());

  return (upcomingDeliveries.length ? upcomingDeliveries : datedDeliveries).slice(0, 5);
});

const projectHighlights = computed(() => {
  const visibleProjects = inProgressProjects.value.length ? inProgressProjects.value : projects.value;

  return visibleProjects.slice(0, 5);
});

const recentAttachments = computed(() =>
  [...attachments.value]
    .sort((a, b) => dateTime(b.uploadedAt) - dateTime(a.uploadedAt))
    .slice(0, 5),
);

function parseCurrency(value) {
  const normalizedValue = String(value || '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  return Number(normalizedValue) || 0;
}

function dateTime(value) {
  const [day, month, year] = String(value || '').split('/').map(Number);

  if (!day || !month || !year) return 0;

  return new Date(year, month - 1, day).getTime();
}

function todayTime() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime();
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function summarizeBy(items, getLabel) {
  const total = items.length;
  const counts = items.reduce((acc, item) => {
    const label = getLabel(item) || 'Não informado';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percentage: total ? Math.max(8, Math.round((count / total) * 100)) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
</script>

<style scoped>
.page-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 300px;
  text-align: center;
  color: #4a5672;
}

.page-status--error {
  color: #c0392b;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f5;
  border-top-color: #050866;
  border-radius: 50%;
  animation: loader-spin 0.8s linear infinite;
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}

.company-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  gap: 22px;
  align-items: stretch;
  padding: 24px;
  border: 1px solid rgba(0, 74, 232, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(0, 74, 232, 0.1), rgba(0, 163, 74, 0.08)),
    #ffffff;
  box-shadow: 0 16px 34px rgba(5, 8, 102, 0.08);
}

.company-hero__copy {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 14px;
}

.company-hero__copy h3 {
  max-width: 760px;
  color: var(--text-strong);
  font-size: 28px;
  line-height: 1.18;
}

.company-hero__copy p:not(.pill) {
  max-width: 760px;
}

.section-heading {
  display: grid;
  justify-items: start;
  gap: 10px;
}

.section-heading h3 {
  color: var(--text-strong);
  line-height: 1.2;
}

.company-hero__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.company-hero__details div {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--stroke-soft);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.76);
}

.company-hero__details dt,
.details__row dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 700;
}

.company-hero__details dd {
  margin: 6px 0 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.metric-card__value {
  display: block;
  margin-top: 10px;
  color: var(--text-strong);
  font-size: 28px;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.metric-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94));
}

.metric-card::after {
  content: '';
  position: absolute;
  right: -44px;
  bottom: -72px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 163, 74, 0.12), rgba(0, 163, 74, 0) 72%);
  pointer-events: none;
}

.metric-card :deep(.card__body) {
  position: relative;
  z-index: 1;
  align-items: flex-start;
  gap: 12px;
}

.dashboard-grid,
.dashboard-columns {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: var(--space-5);
  align-items: start;
}

.dashboard-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.company-summary-card :deep(.card__body) {
  gap: 10px;
}

.company-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.company-info-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--stroke-soft);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(247, 250, 255, 0.96), rgba(255, 255, 255, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.company-info-card span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.company-info-card strong {
  color: var(--text-strong);
  font-size: 18px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.company-info-card small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

.overview-list,
.overview-group,
.overview-group__rows,
.work-grid,
.timeline-grid,
.project-grid,
.document-grid {
  display: grid;
  gap: 12px;
}

.expandable-panel {
  position: relative;
  overflow: hidden;
  transition: max-height 0.28s ease;
}

.expandable-panel--overview {
  max-height: 260px;
}

.expandable-panel--expanded {
  max-height: 1200px;
}

.expandable-panel--overview:not(.expandable-panel--expanded)::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 72px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--card));
  pointer-events: none;
}

.card-toggle {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(0, 74, 232, 0.16);
  border-radius: 999px;
  background: rgba(0, 74, 232, 0.06);
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card-toggle:hover,
.card-toggle:focus-visible {
  background: rgba(0, 74, 232, 0.1);
  border-color: rgba(0, 74, 232, 0.24);
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 74, 232, 0.08);
  outline: none;
}

.overview-group {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--stroke-soft);
}

.overview-group:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.overview-group header,
.overview-row div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.overview-group header span,
.content-card p,
.content-card span,
.content-card__meta {
  color: var(--muted);
  font-size: 13px;
}

.overview-group header strong,
.overview-row strong,
.content-card strong {
  color: var(--text-strong);
}

.overview-row {
  display: grid;
  gap: 8px;
}

.overview-row__bar {
  display: block;
  height: 8px;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(0, 74, 232, 0.08);
}

.overview-row__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #004ae8, #00a34a);
}

.content-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--stroke-soft);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 255, 0.94));
  box-shadow: 0 10px 24px rgba(5, 8, 102, 0.06);
}

.content-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.content-card__header p {
  margin-top: 4px;
}

.content-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.content-card--delivery {
  grid-template-columns: 104px minmax(0, 1fr);
  align-items: start;
}

.content-card--delivery time {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border-radius: 8px;
  color: #087443;
  background: rgba(0, 163, 74, 0.1);
  border: 1px solid rgba(0, 163, 74, 0.18);
  font-size: 13px;
  font-weight: 800;
}

.content-card--delivery span {
  display: block;
  margin-top: 6px;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--text-strong);
  border: 1px solid rgba(5, 8, 102, 0.08);
  background: rgba(5, 8, 102, 0.04);
  font-size: 12px;
  font-weight: 700;
}

.info-chip--blue {
  display: inline-flex;
  color: #1450c8;
  border: 1px solid rgba(0, 74, 232, 0.16);
  background: rgba(0, 74, 232, 0.08);
}

.empty-state {
  padding: 14px;
  border-radius: 8px;
  color: var(--muted);
  background: rgba(0, 74, 232, 0.05);
}

@media (max-width: 1100px) {
  .company-hero,
  .dashboard-grid,
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .company-hero {
    padding: 18px;
  }

  .company-hero__details {
    grid-template-columns: 1fr;
  }

  .company-info-grid {
    grid-template-columns: 1fr;
  }

  .content-card__header {
    display: grid;
  }

  .content-card--delivery {
    grid-template-columns: 1fr;
  }

  .content-card--delivery time {
    justify-content: flex-start;
    width: max-content;
    padding: 0 10px;
  }
}
</style>