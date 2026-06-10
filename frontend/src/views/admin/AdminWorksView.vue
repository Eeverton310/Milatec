<template>
  <div class="page page--wide">
    <FiltersBar
      :count="filteredWorks.length"
      :total="works.length"
      label="obras"
      :show-clear="Boolean(searchTerm || selectedStage)"
      @clear="clearFilters"
    >
      <BaseInput v-model="searchTerm" label="Buscar" placeholder="Cliente, obra ou cidade" tone="light" />
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
            <span class="column-label">Etapa da obra</span>
            <h3>{{ column.stage }}</h3>
          </div>
          <strong>{{ column.total }}</strong>
        </header>

        <div class="kanban-column__body">
          <button v-for="work in column.items" :key="work.id" type="button" class="kanban-card" @click="openDetail(work)">
            <span class="kanban-card__title">{{ work.name }}</span>

            <span class="kanban-card__fields">
              <span class="kanban-card__field">
                <span>Cliente</span>
                <strong>{{ work.client }}</strong>
              </span>
              <span class="kanban-card__field">
                <span>Cidade</span>
                <strong>{{ work.city }}</strong>
              </span>
            </span>

            <span class="kanban-card__meta">
              <span class="info-chip">{{ work.projectCount }} projetos</span>
              <span class="info-chip">{{ work.deliveryCount }} entregas</span>
            </span>
          </button>
        </div>
      </article>
    </section>

    <div v-else class="board-empty">Nenhuma obra encontrada com os filtros atuais.</div>

    <div v-if="selectedWork" class="modal-backdrop" role="presentation" @click.self="closeDetail">
      <section
        class="detail-modal record-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Detalhes da obra ${selectedWork.name}`"
      >
        <header class="record-modal__header">
          <div>
            <h3>{{ selectedWork.name }}</h3>
            <p>{{ selectedWork.client }} · {{ selectedWork.city }}</p>
          </div>

          <div class="record-modal__actions">
            <button class="icon-button" type="button" aria-label="Imprimir detalhe" @click="printDetail">
              <span class="material-icons" aria-hidden="true">print</span>
            </button>
            <button class="icon-button" type="button" aria-label="Copiar resumo" @click="copyDetail">
              <span class="material-icons" aria-hidden="true">link</span>
            </button>
            <button class="icon-button" type="button" aria-label="Fechar detalhe" @click="closeDetail">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
        </header>

        <div class="record-modal__content">
          <section class="record-section">
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
              <div v-for="project in selectedWork.linkedProjects" :key="project.id" class="record-table__row">
                <strong>{{ project.name }}</strong>
                <span>{{ displayValue(project.budgetType) }}</span>
                <span>{{ displayValue(project.product) }}</span>
                <span>{{ displayValue(project.stage) }}</span>
                <span>{{ displayValue(project.quantity) }}</span>
                <span>{{ project.registrationAttachment ? 'Liberado' : 'Sem fotos' }}</span>
              </div>
              <p v-if="!selectedWork.linkedProjects.length" class="record-empty">Sem projetos vinculados.</p>
            </div>
          </section>

          <section class="record-section">
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
              <div v-for="delivery in selectedWork.linkedDeliveries" :key="delivery.id" class="record-table__row record-table__row--deliveries">
                <strong>{{ delivery.name }}</strong>
                <span>{{ displayValue(delivery.deliveryAddress) }}</span>
                <span>{{ displayValue(delivery.stage) }}</span>
                <span>{{ displayValue(delivery.invoiceDate) }}</span>
                <span>{{ displayValue(delivery.quantity) }}</span>
                <span>{{ displayValue(delivery.value) }}</span>
              </div>
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
                <small>{{ selectedWork.client }}</small>
              </div>
            </div>
          </section>

          <section class="record-section">
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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import BaseInput from '@/components/common/BaseInput.vue';
import BaseSelect from '@/components/common/BaseSelect.vue';
import FiltersBar from '@/components/common/FiltersBar.vue';
import { getAdminPortalData } from '@/services/portalData';
import { matchesSearch, uniqueTextOptions } from '@/utils/text';
import { stageStyle } from '@/utils/stageColors';

const { works } = getAdminPortalData();
const searchTerm = ref('');
const selectedStage = ref('');
const selectedWorkId = ref('');

const stageOptions = computed(() => [
  { label: 'Todas as etapas', value: '' },
  ...uniqueTextOptions(works.map((work) => work.stage)).map((stage) => ({
    label: stage,
    value: stage,
  })),
]);

const filteredWorks = computed(() =>
  works.filter(
    (work) =>
      (!selectedStage.value || work.stage === selectedStage.value) &&
      matchesSearch([work.client, work.name, work.city, work.stage], searchTerm.value),
  ),
);

const selectedWork = computed(() => works.find((work) => work.id === selectedWorkId.value) || null);

const kanbanColumns = computed(() => {
  const stages = [...new Set(filteredWorks.value.map((work) => work.stage))];

  return stages.map((stage) => {
    const stageItems = filteredWorks.value.filter((work) => work.stage === stage);

    return {
      stage,
      total: stageItems.length,
      items: stageItems,
    };
  });
});

const clearFilters = () => {
  searchTerm.value = '';
  selectedStage.value = '';
};

const openDetail = (work) => {
  selectedWorkId.value = work.id;
};

const closeDetail = () => {
  selectedWorkId.value = '';
};

const displayValue = (value) => value || '-';

const purchaseOrderAttachment = (work) =>
  work?.linkedDeliveries?.find((delivery) => delivery.purchaseOrderAttachment)?.purchaseOrderAttachment || null;

const registrationAttachments = (work) =>
  (work?.linkedProjects || []).map((project) => project.registrationAttachment).filter(Boolean);

const resolveActionIcon = (actionLabel) => {
  const iconByAction = {
    Visualizar: 'visibility',
    Baixar: 'download',
  };

  return iconByAction[actionLabel] || 'description';
};

const printDetail = () => {
  if (typeof window !== 'undefined') window.print();
};

const copyDetail = async () => {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !selectedWork.value) return;

  const summary = `${selectedWork.value.name} - ${selectedWork.value.client} - ${selectedWork.value.city}`;
  await navigator.clipboard.writeText(summary);
};
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 304px));
  gap: 14px;
  align-items: start;
  justify-content: start;
}

.board-empty {
  padding: 18px 20px;
  border: 1px solid var(--stroke-soft);
  border-radius: 8px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.76);
}

.kanban-column {
  display: grid;
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
  padding: 12px;
  border: 1px solid #e6edf6;
  border-radius: 8px;
  text-align: left;
  color: var(--text);
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(5, 8, 102, 0.05);
  cursor: pointer;
  font: inherit;
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

.kanban-card__field > span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.kanban-card__field strong {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}

.kanban-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--text-strong);
  border: 1px solid rgba(5, 8, 102, 0.08);
  background: rgba(5, 8, 102, 0.04);
  font-size: 12px;
  font-weight: 700;
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
}

.record-section h4 {
  color: #202332;
  font-size: 16px;
  font-weight: 800;
}

.record-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 22px;
}

.record-summary-grid > div,
.attachment-panel,
.address-panel {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.record-summary-grid span,
.attachment-panel > span,
.address-panel span,
.record-photo-field > span {
  color: #202332;
  font-size: 12px;
  font-weight: 700;
}

.record-summary-grid strong,
.attachment-panel strong,
.address-panel strong {
  color: #202332;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
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

.record-two-columns {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr);
  gap: 10px;
}

.attachment-panel,
.address-panel {
  min-height: 68px;
  padding: 12px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: #ffffff;
}

.address-panel small {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.45;
}

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

.attachment-panel .attachment-action,
.record-photo-box .attachment-action {
  justify-content: flex-start;
  border-radius: 8px;
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
  .kanban-board {
    grid-template-columns: 1fr;
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

  .record-modal__content {
    padding: 14px 10px 22px;
  }

  .record-two-columns,
  .record-summary-grid,
  .record-photo-field {
    grid-template-columns: 1fr;
  }
}
</style>
