<template>
  <div class="page page--wide">
    <FiltersBar
      :count="filteredProjects.length"
      :total="projects.length"
      label="projetos"
      :show-clear="Boolean(searchTerm || selectedStage)"
      @clear="clearFilters"
    >
      <BaseInput v-model="searchTerm" label="Buscar" placeholder="Cliente, projeto, local ou tipo" tone="light" />
      <BaseSelect v-model="selectedStage" label="Etapa" :options="stageOptions" tone="light" />
    </FiltersBar>

    <section v-if="filteredProjects.length" class="kanban-board" aria-label="Projetos por etapa">
      <article
        v-for="column in kanbanColumns"
        :key="column.stage"
        class="kanban-column"
        :style="stageStyle(column.stage, 'project')"
      >
        <header class="kanban-column__header">
          <div>
            <span class="column-label">Etapa do projeto</span>
            <h3>{{ column.stage }}</h3>
          </div>
          <strong>{{ column.total }}</strong>
        </header>

        <div class="kanban-column__body">
          <button
            v-for="project in column.items"
            :key="project.id"
            type="button"
            class="kanban-card"
            @click="openDetail(project)"
          >
            <span class="kanban-card__title">{{ project.name }}</span>

            <span class="kanban-card__fields">
              <span class="kanban-card__field">
                <span>Cliente</span>
                <strong>{{ project.client }}</strong>
              </span>
              <span class="kanban-card__field">
                <span>Local</span>
                <strong>{{ project.location }}</strong>
              </span>
              <span class="kanban-card__field">
                <span>Tipo</span>
                <strong>{{ project.type }}</strong>
              </span>
            </span>

            <span class="kanban-card__meta">
              <span class="info-chip">{{ project.quantity }}</span>
              <span class="info-chip">{{ project.unitValue }}</span>
              <span class="info-chip info-chip--strong">{{ project.totalValue }}</span>
            </span>
          </button>
        </div>
      </article>
    </section>

    <div v-else class="board-empty">Nenhum projeto encontrado com os filtros atuais.</div>

    <div v-if="selectedProject" class="modal-backdrop" role="presentation" @click.self="closeDetail">
      <section
        class="detail-modal project-record-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Detalhes do projeto ${selectedProject.name}`"
      >
        <header class="project-record-modal__header">
          <div>
            <h3>{{ selectedProject.name }}</h3>
            <p>{{ selectedProject.client }} · {{ selectedProject.workCity }}</p>
          </div>

          <div class="project-record-modal__actions">
            <button class="record-icon-button" type="button" aria-label="Imprimir detalhe" @click="printDetail">
              <span class="material-icons" aria-hidden="true">print</span>
            </button>
            <button class="record-icon-button" type="button" aria-label="Copiar resumo" @click="copyDetail">
              <span class="material-icons" aria-hidden="true">link</span>
            </button>
            <button class="record-icon-button" type="button" aria-label="Fechar detalhe" @click="closeDetail">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
        </header>

        <nav class="project-record-tabs" aria-label="Seções do projeto">
          <button class="project-record-tabs__item project-record-tabs__item--active" type="button">
            Documentação
          </button>
        </nav>

        <div class="project-record-content">
          <section class="project-record-section">
            <div class="project-field-grid">
              <div class="project-field">
                <span>Projeto</span>
                <strong>{{ selectedProject.name }}</strong>
              </div>
              <div class="project-field">
                <span>Obra vinculada</span>
                <strong>{{ displayValue(selectedProject.workName) }}</strong>
              </div>
              <div class="project-field">
                <span>Cidade da obra</span>
                <span class="record-chip record-chip--muted">{{ displayValue(selectedProject.workCity) }}</span>
              </div>
              <div class="project-field">
                <span>Produto</span>
                <span class="record-chip record-chip--green">{{ displayValue(selectedProject.product) }}</span>
              </div>
              <div class="project-field">
                <span>Tipo de Projeto</span>
                <span class="record-chip record-chip--green">{{ displayValue(selectedProject.type) }}</span>
              </div>
              <div class="project-field">
                <span>Etapa do Projeto</span>
                <span class="record-chip record-chip--stage" :style="stageStyle(selectedProject.stage, 'project')">
                  {{ selectedProject.stage }}
                </span>
              </div>
            </div>

            <div class="budget-record-card">
              <span>Orçamento</span>
              <strong>{{ selectedProject.budgetName }}</strong>
              <div class="chip-list">
                <span class="record-chip record-chip--danger">{{ selectedProject.budgetStatus }}</span>
                <span class="record-chip record-chip--muted">{{ selectedProject.budgetType }}</span>
              </div>
            </div>

            <div class="project-value-grid">
              <div>
                <span>Quantidade</span>
                <strong>{{ displayValue(selectedProject.quantity) }}</strong>
              </div>
              <div>
                <span>Valor da Unidade</span>
                <strong>{{ displayValue(selectedProject.unitValue) }}</strong>
              </div>
              <div>
                <span>Valor Total do Projeto</span>
                <strong>{{ displayValue(selectedProject.totalValue) }}</strong>
              </div>
            </div>
          </section>

          <section class="project-record-section">
            <h4>Documentação</h4>

            <div class="project-document-grid">
              <div v-for="item in projectDocumentRows(selectedProject)" :key="item.label" class="project-document-slot">
                <span>{{ item.label }}</span>
                <a
                  v-if="item.attachment"
                  :href="item.attachment.href"
                  class="attachment-action"
                  :aria-label="item.attachment.actionLabel"
                >
                  <span class="material-icons" aria-hidden="true">
                    {{ resolveActionIcon(item.attachment.actionLabel) }}
                  </span>
                  <span>{{ item.attachment.name }}</span>
                </a>
                <strong v-else>Sem anexos</strong>
              </div>
            </div>

            <div class="project-registry">
              <span>Registro da Obra</span>
              <div class="project-registry__box">
                <a
                  v-if="selectedProject.registrationAttachment"
                  :href="selectedProject.registrationAttachment.href"
                  class="attachment-action"
                  :aria-label="selectedProject.registrationAttachment.actionLabel"
                >
                  <span class="material-icons" aria-hidden="true">
                    {{ resolveActionIcon(selectedProject.registrationAttachment.actionLabel) }}
                  </span>
                  <span>{{ selectedProject.registrationAttachment.name }}</span>
                </a>
                <strong v-else>Sem anexos</strong>
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

const { projects } = getAdminPortalData();
const searchTerm = ref('');
const selectedStage = ref('');
const selectedProjectId = ref('');

const stageOptions = computed(() => [
  { label: 'Todas as etapas', value: '' },
  ...uniqueTextOptions(projects.map((project) => project.stage)).map((stage) => ({
    label: stage,
    value: stage,
  })),
]);

const filteredProjects = computed(() =>
  projects.filter(
    (project) =>
      (!selectedStage.value || project.stage === selectedStage.value) &&
      matchesSearch(
        [project.client, project.name, project.location, project.type, project.stage],
        searchTerm.value,
      ),
  ),
);

const selectedProject = computed(() => projects.find((project) => project.id === selectedProjectId.value) || null);

const kanbanColumns = computed(() => {
  const stages = [...new Set(filteredProjects.value.map((project) => project.stage))];

  return stages.map((stage) => {
    const stageItems = filteredProjects.value.filter((project) => project.stage === stage);

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

const openDetail = (project) => {
  selectedProjectId.value = project.id;
};

const closeDetail = () => {
  selectedProjectId.value = '';
};

const displayValue = (value) => value || '-';

const projectDocumentRows = (project) => [
  {
    label: 'Pré-projeto',
    attachment: project.preProjectAttachment,
  },
  {
    label: 'Projeto para aprovação',
    attachment: project.approvalAttachment,
  },
  {
    label: 'Projeto executivo',
    attachment: project.executiveAttachment,
  },
];

const resolveActionIcon = (actionLabel) => {
  const iconByAction = {
    Visualizar: 'visibility',
    Abrir: 'visibility',
    Baixar: 'download',
  };

  return iconByAction[actionLabel] || 'description';
};

const printDetail = () => {
  if (typeof window !== 'undefined') window.print();
};

const copyDetail = async () => {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !selectedProject.value) return;

  const summary = `${selectedProject.value.name} - ${selectedProject.value.client} - ${selectedProject.value.workName}`;
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

.info-chip--strong {
  color: #1450c8;
  border-color: rgba(0, 74, 232, 0.16);
  background: rgba(0, 74, 232, 0.08);
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

.detail-modal {
  display: grid;
  width: min(1100px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--shadow-lg);
}

.project-record-modal__header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 32px 32px 24px;
  border-bottom: 1px solid #e7ecf3;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}

.project-record-modal__header h3 {
  color: #202332;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.22;
  text-transform: uppercase;
}

.project-record-modal__header p {
  margin-top: 8px;
  color: #687083;
  font-size: 13px;
  line-height: 1.5;
}

.project-record-modal__actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.record-icon-button {
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

.record-icon-button:hover,
.record-icon-button:focus-visible {
  border-color: #dfe5ee;
  color: var(--primary);
  background: #f5f7fb;
  outline: none;
}

.record-icon-button .material-icons {
  font-size: 19px;
}

.project-record-tabs {
  display: flex;
  gap: 22px;
  padding: 0 32px;
  border-bottom: 1px solid #e7ecf3;
  background: #ffffff;
}

.project-record-tabs__item {
  min-height: 44px;
  padding: 0;
  border: none;
  border-bottom: 2px solid transparent;
  color: #111827;
  background: transparent;
  font-size: 12px;
  font-weight: 700;
}

.project-record-tabs__item--active {
  border-bottom-color: #111827;
}

.project-record-content {
  display: grid;
  gap: 26px;
  padding: 18px 16px 28px;
  background: #ffffff;
}

.project-record-section {
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid #edf1f7;
  border-radius: 8px;
  background: #f5f7fb;
}

.project-record-section h4 {
  color: #202332;
  font-size: 16px;
  font-weight: 800;
}

.project-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(170px, 1fr));
  gap: 18px 22px;
}

.project-field,
.budget-record-card,
.project-value-grid > div,
.project-document-slot,
.project-registry {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.project-field > span:first-child,
.budget-record-card > span,
.project-value-grid span,
.project-document-slot > span,
.project-registry > span {
  color: #202332;
  font-size: 12px;
  font-weight: 700;
}

.project-field strong,
.budget-record-card strong,
.project-value-grid strong {
  color: #202332;
  font-size: 13px;
  font-weight: 600;
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
  max-width: 100%;
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
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

.record-chip--danger {
  color: #b4233c;
  background: rgba(194, 65, 93, 0.12);
}

.record-chip--stage {
  color: var(--stage-color, #1450c8);
  border: 1px solid var(--stage-border, rgba(20, 80, 200, 0.12));
  background: var(--stage-bg, rgba(20, 80, 200, 0.08));
}

.budget-record-card {
  min-height: 68px;
  padding: 12px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: #ffffff;
}

.project-value-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(170px, 1fr));
  gap: 18px 22px;
}

.project-document-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  gap: 18px 26px;
}

.project-document-slot {
  min-height: 78px;
}

.project-document-slot strong,
.project-registry__box strong {
  display: grid;
  place-items: center;
  min-height: 40px;
  border: 1px solid #dfe5ee;
  border-radius: 4px;
  color: #a0a7b4;
  background: rgba(255, 255, 255, 0.42);
  font-size: 12px;
  font-weight: 500;
}

.project-document-slot .attachment-action,
.project-registry__box .attachment-action {
  justify-content: flex-start;
  border-radius: 8px;
  background: #ffffff;
}

.project-registry__box {
  display: grid;
  align-content: center;
  justify-items: center;
  min-height: 230px;
  padding: 18px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.42);
}

@media (max-width: 720px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    padding: 0;
  }

  .detail-modal {
    width: 100%;
    max-height: 100vh;
    min-height: 100vh;
    border-radius: 0;
  }

  .project-record-modal__header {
    padding: 22px 16px 16px;
  }

  .project-record-modal__header h3 {
    font-size: 22px;
  }

  .project-record-tabs {
    padding: 0 16px;
  }

  .project-record-content {
    padding: 14px 10px 22px;
  }

  .project-field-grid,
  .project-value-grid,
  .project-document-grid {
    grid-template-columns: 1fr;
  }
}
</style>
