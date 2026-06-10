<template>
  <div class="page page--wide">
    <div v-if="isLoading" class="page-status page-status--loading">
      <span class="loader" aria-hidden="true"></span>
      <p>Carregando obras...</p>
    </div>

    <div v-else-if="error" class="page-status page-status--error">
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <FiltersBar
      :count="filteredWorks.length"
      :total="works.length"
      label="obras"
      :show-clear="Boolean(searchTerm || selectedStage || selectedWorkFilterId)"
      @clear="clearFilters"
    >
      <BaseInput v-model="searchTerm" label="Buscar" placeholder="Obra, cidade ou tipo de orçamento" tone="light" />
      <BaseSelect v-model="selectedWorkFilterId" label="Obra" :options="workOptions" tone="light" />
      <BaseSelect v-model="selectedStage" label="Etapa" :options="stageOptions" tone="light" />
    </FiltersBar>

    <section v-if="filteredWorks.length" class="kanban-board" aria-label="Obras por etapa">
      <article
        v-for="column in kanbanColumns"
        :key="column.stage"
        class="kanban-column"
        :style="stageStyle(column.stage, 'work')"
      >
        <header class="kanban-column__header">
          <div>
            <span class="column-label">Etapa</span>
            <h3>{{ column.stage }}</h3>
          </div>
          <strong>{{ column.total }}</strong>
        </header>

        <div class="kanban-column__body">
          <button
            v-for="work in column.items"
            :key="work.id"
            class="kanban-card"
            type="button"
            @click="selectWork(work)"
          >
            <span class="kanban-card__title">{{ work.name }}</span>

            <span class="kanban-card__fields">
              <span class="kanban-card__field">
                <span>Tipo de orçamento</span>
                <strong>{{ work.budgetType }}</strong>
              </span>
              <span class="kanban-card__field">
                <span>Cidade</span>
                <strong>{{ work.city }}</strong>
              </span>
            </span>
          </button>

          <p v-if="!column.items.length" class="empty-state">Nenhuma obra nesta etapa.</p>

          <button v-if="column.hasMore" class="load-more" type="button" @click="showMore(column.stage)">
            Mostrar mais
          </button>
        </div>
      </article>
    </section>

    <div v-else class="board-empty">Nenhuma obra encontrada com os filtros atuais.</div>

    <div
      v-if="selectedWork"
      class="modal-backdrop"
      role="presentation"
      @click.self="closeDetail"
    >
      <section
        class="detail-modal record-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Detalhes da obra ${selectedWork.name}`"
      >
        <header class="record-modal__header">
          <div>
            <h3>{{ selectedWork.name }}</h3>
            <p>{{ portalCompany.name }} · {{ selectedWork.city }}</p>
          </div>

          <div class="record-modal__actions">
            <button class="icon-button" type="button" aria-label="Imprimir detalhe">
              <span class="material-icons" aria-hidden="true">print</span>
            </button>
            <button class="icon-button" type="button" aria-label="Copiar link">
              <span class="material-icons" aria-hidden="true">link</span>
            </button>
            <button class="icon-button" type="button" aria-label="Fechar detalhe" @click="closeDetail">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
        </header>

        <nav class="record-tabs" aria-label="Seções da obra">
          <button class="record-tabs__item record-tabs__item--active" type="button" @click="scrollDetailSection('work-record-obra')">
            Obra
          </button>
          <button class="record-tabs__item" type="button" @click="scrollDetailSection('work-record-projetos')">
            Projetos
          </button>
          <button class="record-tabs__item" type="button" @click="scrollDetailSection('work-record-entregas')">
            Entregas
          </button>
          <button class="record-tabs__item" type="button" @click="scrollDetailSection('work-record-registros')">
            Registros
          </button>
        </nav>

        <div class="record-modal__content">
          <section id="work-record-obra" class="record-section">
            <h4>Obra</h4>

            <div class="record-field-grid">
              <div class="record-field">
                <span>Cidade da Obra</span>
                <strong>{{ displayValue(selectedWork.city) }}</strong>
              </div>
              <div class="record-field">
                <span>Quantidade</span>
                <strong>{{ displayValue(selectedWork.quantity) }}</strong>
              </div>
              <div class="record-field">
                <span>Valor</span>
                <strong>{{ displayValue(selectedWork.value) }}</strong>
              </div>
              <div class="record-field">
                <span>Tipo de Obra</span>
                <div class="chip-list">
                  <span v-for="type in budgetTypeChips(selectedWork)" :key="type" class="record-chip record-chip--green">
                    {{ type }}
                  </span>
                </div>
              </div>
              <div class="record-field">
                <span>Etapa de Negócio</span>
                <span class="record-chip record-chip--stage" :style="stageStyle(selectedWork.stage, 'work')">
                  {{ selectedWork.stage }}
                </span>
              </div>
              <div class="record-field">
                <span>Produto (from Projetos)</span>
                <strong>{{ productsLabel(selectedWork) }}</strong>
              </div>
            </div>

            <div class="record-two-columns">
              <div class="company-record">
                <span>Empresa</span>
                <strong>{{ portalCompany.name }}</strong>
                <div class="chip-list">
                  <span class="record-chip record-chip--green">Cliente recorrente</span>
                  <span class="record-chip record-chip--muted">{{ portalCompany.cityState }}</span>
                </div>
              </div>

              <div class="contact-record">
                <span>Contato do Orçamento</span>
                <strong>{{ portalCompany.primaryContact }}</strong>
                <small>{{ portalCompany.primaryEmail }} · {{ portalCompany.primaryPhone }}</small>
              </div>
            </div>

            <div class="attachment-slots">
              <div v-for="slot in workAttachmentSlots(selectedWork)" :key="slot.label" class="attachment-slot">
                <span>{{ slot.label }}</span>
                <a
                  v-if="slot.attachment"
                  :href="slot.attachment.href"
                  class="attachment-action"
                  :aria-label="slot.attachment.actionLabel"
                >
                  <span class="material-icons" aria-hidden="true">{{ resolveActionIcon(slot.attachment.actionLabel) }}</span>
                  <span>{{ slot.attachment.name }}</span>
                </a>
                <strong v-else>Sem anexos</strong>
              </div>
            </div>
          </section>

          <section id="work-record-projetos" class="record-section">
            <h4>Projetos</h4>

            <div class="record-summary-grid">
              <div>
                <span>Valor Total</span>
                <strong>{{ displayValue(selectedWork.value) }}</strong>
              </div>
              <div>
                <span>Quantidade Total</span>
                <strong>{{ displayValue(selectedWork.quantity) }}</strong>
              </div>
            </div>

            <div class="record-table">
              <div class="record-table__head">
                <span>Projeto</span>
                <span>Tipo orçamento</span>
                <span>Produto</span>
                <span>Etapa</span>
                <span>Quantidade</span>
                <span>Registro</span>
              </div>
              <button
                v-for="project in selectedWork.linkedProjects"
                :key="project.id"
                class="record-table__row"
                type="button"
                @click="goToProject(project.id)"
              >
                <strong>{{ project.name }}</strong>
                <span>{{ displayValue(project.budgetType) }}</span>
                <span>{{ displayValue(project.product) }}</span>
                <span>{{ displayValue(project.stage) }}</span>
                <span>{{ displayValue(project.quantity) }}</span>
                <span>{{ project.registrationAttachment ? 'Liberado' : 'Sem fotos' }}</span>
              </button>
              <p v-if="!selectedWork.linkedProjects.length" class="record-empty">Sem projetos vinculados.</p>
            </div>
          </section>

          <section id="work-record-entregas" class="record-section">
            <h4>Entregas</h4>

            <div class="record-table">
              <div class="record-table__head record-table__head--deliveries">
                <span>Entrega</span>
                <span>Endereço</span>
                <span>Etapa</span>
                <span>Data faturamento</span>
                <span>Quantidade</span>
                <span>Valor</span>
              </div>
              <button
                v-for="delivery in selectedWork.linkedDeliveries"
                :key="delivery.id"
                class="record-table__row record-table__row--deliveries"
                type="button"
                @click="goToDelivery(delivery.id)"
              >
                <strong>{{ delivery.name }}</strong>
                <span>{{ displayValue(delivery.deliveryAddress) }}</span>
                <span>{{ displayValue(delivery.stage) }}</span>
                <span>{{ displayValue(delivery.invoiceDate) }}</span>
                <span>{{ displayValue(delivery.quantity) }}</span>
                <span>{{ displayValue(delivery.value) }}</span>
              </button>
              <p v-if="!selectedWork.linkedDeliveries.length" class="record-empty">Sem entregas vinculadas.</p>
            </div>

            <div class="record-two-columns">
              <div class="attachment-panel">
                <span>Pedido de Compra (anexo)</span>
                <a
                  v-if="purchaseOrderAttachment(selectedWork)"
                  :href="purchaseOrderAttachment(selectedWork).href"
                  class="attachment-action"
                  :aria-label="purchaseOrderAttachment(selectedWork).actionLabel"
                >
                  <span class="material-icons" aria-hidden="true">
                    {{ resolveActionIcon(purchaseOrderAttachment(selectedWork).actionLabel) }}
                  </span>
                  <span>{{ purchaseOrderAttachment(selectedWork).name }}</span>
                </a>
                <strong v-else>Sem anexos</strong>
              </div>

              <div class="address-panel">
                <span>Endereço de entrega</span>
                <strong>{{ displayValue(selectedWork.city) }}</strong>
                <small>{{ portalCompany.name }}</small>
              </div>
            </div>
          </section>

          <section id="work-record-registros" class="record-section">
            <h4>Registros</h4>

            <div class="record-photo-field">
              <span>Fotos da Obra</span>
              <div class="record-photo-box">
                <template v-if="registrationAttachments(selectedWork).length">
                  <a
                    v-for="attachment in registrationAttachments(selectedWork)"
                    :key="attachment.id"
                    :href="attachment.href"
                    class="attachment-action"
                    :aria-label="attachment.actionLabel"
                  >
                    <span class="material-icons" aria-hidden="true">{{ resolveActionIcon(attachment.actionLabel) }}</span>
                    <span>{{ attachment.name }}</span>
                  </a>
                </template>
                <template v-else>
                  <span class="material-icons" aria-hidden="true">photo_camera</span>
                  <strong>Sem fotos liberadas</strong>
                </template>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseInput from '@/components/common/BaseInput.vue';
import BaseSelect from '@/components/common/BaseSelect.vue';
import FiltersBar from '@/components/common/FiltersBar.vue';
import { useClientPortalData } from '@/composables/useClientPortalData';
import { stageStyle } from '@/utils/stageColors';
import { matchesSearch, normalizeText, uniqueTextOptions } from '@/utils/text';

const route = useRoute();
const router = useRouter();
const { portalData, isLoading, error } = useClientPortalData();
const selectedWorkId = ref('');
const columnLimits = ref({});
const searchTerm = ref('');
const selectedWorkFilterId = ref('');
const selectedStage = ref('');
const kanbanPageSize = 6;

const portalCompany = computed(() => portalData.value.company);
const works = computed(() => portalData.value.works);
const workOptions = computed(() => [
  { label: 'Todas as obras', value: '' },
  ...works.value.map((work) => ({
    label: work.name,
    value: work.id,
  })),
]);
const stageOptions = computed(() => [
  { label: 'Todas as etapas', value: '' },
  ...uniqueTextOptions(works.value.map((work) => work.stage)).map((stage) => ({
    label: stage,
    value: stage,
  })),
]);
const filteredWorks = computed(() =>
  works.value.filter(
    (work) =>
      (!selectedWorkFilterId.value || work.id === selectedWorkFilterId.value) &&
      (!selectedStage.value || work.stage === selectedStage.value) &&
      matchesSearch([work.name, work.city, work.budgetType, work.stage], searchTerm.value),
  ),
);
const selectedWork = computed(() => works.value.find((work) => work.id === selectedWorkId.value) || null);
const kanbanColumns = computed(() => {
  const stages = [...new Set(filteredWorks.value.map((work) => work.stage))];

  return stages.map((stage) => {
    const stageItems = filteredWorks.value.filter((work) => work.stage === stage);
    const limit = columnLimits.value[stage] || kanbanPageSize;

    return {
      stage,
      total: stageItems.length,
      items: stageItems.slice(0, limit),
      hasMore: stageItems.length > limit,
    };
  });
});

watch(
  () => route.query.obra,
  (workId) => {
    selectedWorkId.value = typeof workId === 'string' ? workId : '';
  },
  { immediate: true },
);

watch(
  () => route.query.obraFiltro,
  (workFilterId) => {
    selectedWorkFilterId.value = typeof workFilterId === 'string' ? workFilterId : '';
  },
  { immediate: true },
);

watch(selectedWorkFilterId, (workFilterId) => {
  if ((route.query.obraFiltro || '') === workFilterId) return;

  const nextQuery = { ...route.query };
  delete nextQuery.projetoFiltro;

  if (workFilterId) {
    nextQuery.obraFiltro = workFilterId;
  } else {
    delete nextQuery.obraFiltro;
  }

  router.replace({ query: nextQuery });
});

const selectWork = (work) => {
  selectedWorkId.value = work.id;
  router.replace({ query: { ...route.query, obra: work.id } });
};

const closeDetail = () => {
  selectedWorkId.value = '';
  const { obra, ...query } = route.query;
  router.replace({ query });
};

const goToProject = (projectId) => {
  router.push({ path: '/cliente/projetos', query: { projeto: projectId } });
};

const goToDelivery = (deliveryId) => {
  router.push({ path: '/cliente/entregas', query: { entrega: deliveryId } });
};

const showMore = (stage) => {
  columnLimits.value = {
    ...columnLimits.value,
    [stage]: (columnLimits.value[stage] || kanbanPageSize) + kanbanPageSize,
  };
};

const clearFilters = () => {
  searchTerm.value = '';
  selectedWorkFilterId.value = '';
  selectedStage.value = '';
};

const displayValue = (value) => value || '-';

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const budgetTypeChips = (work) => {
  const values = work?.budgetTypes?.length ? work.budgetTypes : [work?.budgetType];
  return uniqueValues(values).length ? uniqueValues(values) : ['Não informado'];
};

const productsLabel = (work) => {
  const products = uniqueValues((work?.linkedProjects || []).map((project) => project.product));
  return products.length ? products.join(' + ') : '-';
};

const attachmentMatchesCategory = (attachment, categories) => {
  const normalizedCategory = normalizeText(attachment.category);
  return categories.some((category) => normalizedCategory === normalizeText(category));
};

const findWorkAttachment = (work, categories) =>
  (work?.attachments || []).find((attachment) => attachmentMatchesCategory(attachment, categories)) || null;

const workAttachmentSlots = (work) => [
  {
    label: 'Proposta Comercial (anexo)',
    attachment: findWorkAttachment(work, ['Proposta comercial', 'Orçamento']),
  },
  {
    label: 'Memorial de Cálculo',
    attachment: findWorkAttachment(work, ['Memorial de cálculo', 'Projeto executivo']),
  },
  {
    label: 'ART',
    attachment: findWorkAttachment(work, ['ART', 'Registro de obra']),
  },
  {
    label: 'Pedido de Compra (anexo)',
    attachment:
      findWorkAttachment(work, ['Pedido de compra']) ||
      (work?.linkedDeliveries || []).find((delivery) => delivery.purchaseOrderAttachment)?.purchaseOrderAttachment ||
      null,
  },
];

const purchaseOrderAttachment = (work) => findWorkAttachment(work, ['Pedido de compra']);

const registrationAttachments = (work) =>
  (work?.attachments || []).filter((attachment) => attachmentMatchesCategory(attachment, ['Registro de obra']));

const scrollDetailSection = (sectionId) => {
  if (typeof document === 'undefined') return;
  document.getElementById(sectionId)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
};

const resolveActionIcon = (actionLabel) => {
  const iconByAction = {
    Visualizar: 'visibility',
    Baixar: 'download',
  };

  return iconByAction[actionLabel] || 'description';
};
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

.kanban-board {
  display: flex;
  gap: 14px;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 12px;
  scrollbar-width: thin;
}

.kanban-board::-webkit-scrollbar {
  height: 10px;
}

.kanban-board::-webkit-scrollbar-track {
  background: rgba(5, 8, 102, 0.05);
  border-radius: 5px;
}

.kanban-board::-webkit-scrollbar-thumb {
  background: rgba(0, 74, 232, 0.25);
  border-radius: 5px;
}

.kanban-board::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 74, 232, 0.4);
}

.board-empty {
  padding: 18px 20px;
  border: 1px solid var(--stroke-soft);
  border-radius: 8px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.76);
}

.kanban-column {
  flex: 0 0 304px;
  width: 304px;
  min-width: 304px;
  max-width: 304px;
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 280px;
  border: 1px solid var(--stage-border, var(--stroke-soft));
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.68);
  overflow: hidden;
  box-shadow: inset 4px 0 0 var(--stage-color, var(--primary)), 0 10px 22px rgba(5, 8, 102, 0.06);
}

.kanban-column__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px;
  border-bottom: 1px solid var(--stage-border, var(--stroke-soft));
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.72)),
    var(--stage-bg, rgba(241, 246, 255, 0.92));
}

.kanban-column__header h3 {
  color: var(--stage-color, var(--text-strong));
  font-size: 15px;
  line-height: 1.25;
}

.kanban-column__header strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: var(--stage-color, var(--primary));
  background: var(--stage-bg, rgba(0, 74, 232, 0.08));
  border: 1px solid var(--stage-border, rgba(0, 74, 232, 0.14));
}

.column-label {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.kanban-column__body {
  display: grid;
  gap: 9px;
  align-content: start;
  padding: 10px;
}

.kanban-card {
  display: grid;
  gap: 10px;
  width: 100%;
  min-height: auto;
  padding: 12px;
  border: 1px solid #e6edf6;
  border-radius: 8px;
  text-align: left;
  color: var(--text);
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(5, 8, 102, 0.05);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.kanban-card:hover,
.kanban-card:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(0, 74, 232, 0.2);
  box-shadow: 0 10px 18px rgba(5, 8, 102, 0.08);
  outline: none;
}

.kanban-card__title {
  display: block;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.28;
}

.kanban-card__fields {
  display: grid;
  gap: 7px;
}

.kanban-card__field {
  display: grid;
  gap: 2px;
}

.kanban-card__field span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
}

.kanban-card__field strong {
  color: #15204a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.empty-state {
  padding: 14px;
  border: 1px dashed var(--stroke);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
}

.load-more {
  min-height: 38px;
  border: 1px solid rgba(0, 74, 232, 0.16);
  border-radius: 8px;
  color: var(--primary);
  background: rgba(0, 74, 232, 0.06);
  font-weight: 700;
  cursor: pointer;
}

.load-more:hover,
.load-more:focus-visible {
  border-color: rgba(0, 74, 232, 0.28);
  background: rgba(0, 74, 232, 0.1);
  outline: none;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  padding: 24px;
  background: rgba(18, 23, 42, 0.38);
}

.record-modal {
  width: min(1080px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--shadow-lg);
}

.record-modal__header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 30px 32px 22px;
  border-bottom: 1px solid #e7ecf3;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}

.record-modal__header h3 {
  color: #202332;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.22;
  text-transform: uppercase;
}

.record-modal__header p {
  margin-top: 8px;
  color: #687083;
  font-size: 13px;
  line-height: 1.5;
}

.record-modal__actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #353b4c;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.icon-button:hover,
.icon-button:focus-visible {
  border-color: #dfe5ee;
  color: var(--primary);
  background: #f5f7fb;
  outline: none;
}

.icon-button .material-icons {
  font-size: 19px;
}

.record-tabs {
  display: flex;
  gap: 22px;
  padding: 0 32px;
  border-bottom: 1px solid #e7ecf3;
  background: #ffffff;
}

.record-tabs__item {
  min-height: 44px;
  padding: 0;
  border: none;
  border-bottom: 2px solid transparent;
  color: #39445a;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.record-tabs__item:hover,
.record-tabs__item:focus-visible,
.record-tabs__item--active {
  color: #111827;
  border-bottom-color: #111827;
  outline: none;
}

.record-modal__content {
  display: grid;
  gap: 26px;
  padding: 18px 16px 28px;
  background: #ffffff;
}

.record-section {
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid #edf1f7;
  border-radius: 8px;
  background: #f5f7fb;
  scroll-margin-top: 160px;
}

.record-section h4 {
  color: #202332;
  font-size: 16px;
  font-weight: 800;
}

.record-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 18px 22px;
}

.record-field,
.record-summary-grid > div,
.company-record,
.contact-record,
.attachment-slot,
.attachment-panel,
.address-panel {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.record-field > span,
.record-summary-grid span,
.company-record span,
.contact-record span,
.attachment-slot > span,
.attachment-panel > span,
.address-panel span,
.record-photo-field > span {
  color: #202332;
  font-size: 12px;
  font-weight: 700;
}

.record-field strong,
.record-summary-grid strong,
.company-record strong,
.contact-record strong,
.attachment-panel strong,
.address-panel strong {
  color: #202332;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.record-two-columns {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr);
  gap: 10px;
}

.company-record,
.contact-record,
.attachment-panel,
.address-panel {
  min-height: 68px;
  padding: 12px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: #ffffff;
}

.contact-record small,
.address-panel small {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.45;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.record-chip {
  display: inline-flex;
  align-items: center;
  width: max-content;
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: #1f2937;
  background: #eef2f7;
}

.record-chip--green {
  color: #0d5f35;
  background: rgba(0, 163, 74, 0.18);
}

.record-chip--muted {
  color: #4b5563;
  background: #eef2f7;
}

.record-chip--stage {
  color: var(--stage-color, #1450c8);
  border: 1px solid var(--stage-border, rgba(20, 80, 200, 0.12));
  background: var(--stage-bg, rgba(20, 80, 200, 0.08));
}

.attachment-slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 18px 26px;
}

.attachment-slot {
  min-height: 78px;
}

.attachment-slot strong,
.attachment-panel strong {
  display: grid;
  place-items: center;
  min-height: 38px;
  border: 1px solid #dfe5ee;
  border-radius: 4px;
  color: #a0a7b4;
  background: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  font-weight: 500;
}

.attachment-slot .attachment-action,
.attachment-panel .attachment-action,
.record-photo-box .attachment-action {
  justify-content: flex-start;
  border-radius: 8px;
  background: #ffffff;
}

.record-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 22px;
}

.record-table {
  display: grid;
  overflow-x: auto;
}

.record-table__head,
.record-table__row {
  display: grid;
  grid-template-columns:
    minmax(170px, 1.1fr)
    minmax(150px, 0.88fr)
    minmax(160px, 1fr)
    minmax(150px, 0.9fr)
    minmax(120px, 0.72fr)
    minmax(110px, 0.68fr);
  min-width: 860px;
  align-items: center;
  gap: 12px;
}

.record-table__head--deliveries,
.record-table__row--deliveries {
  grid-template-columns:
    minmax(180px, 1.05fr)
    minmax(220px, 1.2fr)
    minmax(150px, 0.86fr)
    minmax(140px, 0.8fr)
    minmax(120px, 0.72fr)
    minmax(120px, 0.72fr);
}

.record-table__head {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #dfe5ee;
  color: #7b8495;
  background: #f3f6fa;
  font-size: 11px;
  font-weight: 700;
}

.record-table__row {
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid #dfe5ee;
  border-top: none;
  text-align: left;
  color: #202332;
  background: #ffffff;
  cursor: pointer;
}

.record-table__row:hover,
.record-table__row:focus-visible {
  color: var(--primary);
  background: #f9fbff;
  outline: none;
}

.record-table__row strong,
.record-table__row span {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-table__row strong {
  font-weight: 700;
}

.record-empty {
  display: grid;
  place-items: center;
  min-height: 38px;
  border: 1px solid #dfe5ee;
  color: #a0a7b4;
  font-size: 12px;
  background: #ffffff;
}

.record-photo-field {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 18px;
  align-items: start;
}

.record-photo-box {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 10px;
  min-height: 180px;
  padding: 18px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  color: #a0a7b4;
  background: rgba(255, 255, 255, 0.42);
}

.record-photo-box .material-icons {
  font-size: 28px;
}

.record-photo-box strong {
  color: #a0a7b4;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 720px) {
  .kanban-column {
    flex: 0 0 280px;
    width: 280px;
    min-width: 280px;
    max-width: 280px;
  }

  .modal-backdrop {
    padding: 0;
  }

  .record-modal {
    width: 100%;
    max-height: 100vh;
    min-height: 100vh;
    border-radius: 0;
  }

  .record-modal__header {
    padding: 22px 16px 16px;
  }

  .record-modal__header h3 {
    font-size: 22px;
  }

  .record-tabs {
    gap: 16px;
    overflow-x: auto;
    padding: 0 16px;
  }

  .record-modal__content {
    padding: 14px 10px 22px;
  }

  .record-field-grid,
  .record-two-columns,
  .attachment-slots,
  .record-summary-grid,
  .record-photo-field {
    grid-template-columns: 1fr;
  }
}
</style>