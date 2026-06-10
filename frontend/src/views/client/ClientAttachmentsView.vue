<template>
  <div class="page page--wide">
    <div v-if="isLoading" class="page-status page-status--loading">
      <span class="loader" aria-hidden="true"></span>
      <p>Carregando anexos...</p>
    </div>

    <div v-else-if="error" class="page-status page-status--error">
      <p>{{ error }}</p>
    </div>

    <template v-else>
    <FiltersBar
      :count="filteredAttachments.length"
      :total="attachments.length"
      label="anexos"
      :show-clear="Boolean(searchTerm || selectedCategory || selectedWorkFilterId || selectedProjectFilterId)"
      @clear="clearFilters"
    >
      <BaseInput v-model="searchTerm" label="Buscar" placeholder="Arquivo, vínculo ou categoria" tone="light" />
      <BaseSelect v-model="selectedWorkFilterId" label="Obra" :options="workOptions" tone="light" />
      <BaseSelect v-model="selectedProjectFilterId" label="Projeto" :options="projectOptions" tone="light" />
      <BaseSelect v-model="selectedCategory" label="Categoria" :options="categoryOptions" tone="light" />
    </FiltersBar>

    <BaseCard class="table-card">
      <div class="table">
        <div class="table__head">
          <span>Nome do arquivo</span>
          <span>Vínculo</span>
          <span>Categoria</span>
          <span>Data de upload</span>
          <span>Acesso</span>
        </div>

        <div class="table__body">
          <div v-for="attachment in paginatedAttachments" :key="attachment.id" class="table__row">
            <span class="table__cell table__cell--title">{{ attachment.name }}</span>
            <span class="table__cell table__cell--linked">
              {{ attachment.linkedTypeLabel }} · {{ attachment.linkedRecordName }}
            </span>
            <span class="table__cell">
              <span class="category-chip" :class="categoryClass(attachment.category)">
                {{ attachment.category }}
              </span>
            </span>
            <span class="table__cell">{{ attachment.uploadedAt }}</span>
            <span class="table__cell attachment-actions">
              <button
                type="button"
                class="attachment-action"
                :aria-label="`Visualizar ${attachment.name}`"
                @click="openPreview(attachment)"
              >
                <span class="material-icons" aria-hidden="true">visibility</span>
                <span>Visualizar</span>
              </button>

              <a
                :href="attachment.href"
                class="attachment-action attachment-action--download"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`Baixar ${attachment.name}`"
                @click="handleDownloadClick($event, attachment)"
              >
                <span class="material-icons" aria-hidden="true">download</span>
                <span>Baixar</span>
              </a>
            </span>
          </div>

          <p v-if="!paginatedAttachments.length" class="table__empty">Nenhum anexo encontrado com os filtros atuais.</p>
        </div>
      </div>
    </BaseCard>

    <nav v-if="totalPages > 1" class="pagination" aria-label="Paginação de anexos">
      <button type="button" :disabled="currentPage === 1" @click="currentPage -= 1">
        Anterior
      </button>
      <span>Página {{ currentPage }} de {{ totalPages }}</span>
      <button type="button" :disabled="currentPage === totalPages" @click="currentPage += 1">
        Próxima
      </button>
    </nav>

    <!-- Modal de Preview -->
    <div
      v-if="previewAttachment"
      class="preview-backdrop"
      role="presentation"
      @click.self="closePreview"
    >
      <section
        class="preview-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Visualização de ${previewAttachment.name}`"
      >
        <header class="preview-modal__header">
          <div class="preview-modal__info">
            <span class="category-chip" :class="categoryClass(previewAttachment.category)">
              {{ previewAttachment.category }}
            </span>
            <h3>{{ previewAttachment.name }}</h3>
            <p>{{ previewAttachment.linkedTypeLabel }} · {{ previewAttachment.linkedRecordName }}</p>
          </div>

          <div class="preview-modal__actions">
            <a
              :href="previewAttachment.href"
              class="preview-action preview-action--download"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Baixar ${previewAttachment.name}`"
            >
              <span class="material-icons" aria-hidden="true">download</span>
              <span>Baixar</span>
            </a>
            <button
              type="button"
              class="preview-action preview-action--close"
              aria-label="Fechar visualização"
              @click="closePreview"
            >
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
        </header>

        <div class="preview-modal__body">
          <!-- Preview para imagens -->
          <img
            v-if="isImage(previewAttachment)"
            :src="previewAttachment.href"
            :alt="previewAttachment.name"
            class="preview-image"
          />

          <!-- Preview para PDFs (usa embed que tem mais compatibilidade) -->
          <iframe
            v-else-if="isPdf(previewAttachment)"
            :src="previewAttachment.href"
            :title="`Visualização de ${previewAttachment.name}`"
            class="preview-frame"
          ></iframe>

          <!-- Fallback para arquivos não previsíveis -->
          <div v-else class="preview-fallback">
            <span class="material-icons preview-fallback__icon" aria-hidden="true">description</span>
            <h4>Visualização indisponível neste formato</h4>
            <p>Este arquivo precisa ser baixado para ser visualizado.</p>
            <a
              :href="previewAttachment.href"
              class="preview-action preview-action--download preview-action--large"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="material-icons" aria-hidden="true">download</span>
              <span>Baixar arquivo</span>
            </a>
          </div>
        </div>
      </section>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseCard from '@/components/common/BaseCard.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import BaseSelect from '@/components/common/BaseSelect.vue';
import FiltersBar from '@/components/common/FiltersBar.vue';
import { useClientPortalData } from '@/composables/useClientPortalData';
import { matchesSearch, uniqueTextOptions } from '@/utils/text';

const route = useRoute();
const router = useRouter();
const { portalData, isLoading, error } = useClientPortalData();
const currentPage = ref(1);
const searchTerm = ref('');
const selectedWorkFilterId = ref('');
const selectedProjectFilterId = ref('');
const selectedCategory = ref('');
const previewAttachment = ref(null);
const pageSize = 8;

const works = computed(() => portalData.value.works || []);
const projects = computed(() => portalData.value.projects || []);
const attachments = computed(() =>
  portalData.value.attachments.filter((attachment) =>
    ['orcamento', 'projeto', 'entrega'].includes(attachment.entityType),
  ),
);
const workOptions = computed(() => [
  { label: 'Todas as obras', value: '' },
  ...works.value.map((work) => ({
    label: work.name,
    value: work.id,
  })),
]);
const projectOptions = computed(() => [
  { label: 'Todos os projetos', value: '' },
  ...projects.value.map((project) => ({
    label: project.name,
    value: project.id,
  })),
]);
const categoryOptions = computed(() => [
  { label: 'Todas as categorias', value: '' },
  ...uniqueTextOptions(attachments.value.map((attachment) => attachment.category)).map((category) => ({
    label: category,
    value: category,
  })),
]);
const filteredAttachments = computed(() =>
  attachments.value.filter(
    (attachment) =>
      (!selectedWorkFilterId.value || attachment.relatedWorkIds?.includes(selectedWorkFilterId.value)) &&
      (!selectedProjectFilterId.value || attachment.relatedProjectIds?.includes(selectedProjectFilterId.value)) &&
      (!selectedCategory.value || attachment.category === selectedCategory.value) &&
      matchesSearch(
        [
          attachment.name,
          attachment.linkedTypeLabel,
          attachment.linkedRecordName,
          ...(attachment.relatedWorkNames || []),
          ...(attachment.relatedProjectNames || []),
          attachment.category,
          attachment.uploadedAt,
        ],
        searchTerm.value,
      ),
  ),
);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredAttachments.value.length / pageSize)));
const paginatedAttachments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAttachments.value.slice(start, start + pageSize);
});

watch(filteredAttachments, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
});

watch(
  () => route.query.obraFiltro,
  (workFilterId) => {
    selectedWorkFilterId.value = typeof workFilterId === 'string' ? workFilterId : '';
  },
  { immediate: true },
);

watch(
  () => route.query.projetoFiltro,
  (projectFilterId) => {
    selectedProjectFilterId.value = typeof projectFilterId === 'string' ? projectFilterId : '';
  },
  { immediate: true },
);

watch([selectedWorkFilterId, selectedProjectFilterId], ([workFilterId, projectFilterId]) => {
  const currentWorkFilterId = typeof route.query.obraFiltro === 'string' ? route.query.obraFiltro : '';
  const currentProjectFilterId = typeof route.query.projetoFiltro === 'string' ? route.query.projetoFiltro : '';

  if (currentWorkFilterId === workFilterId && currentProjectFilterId === projectFilterId) return;

  const nextQuery = { ...route.query };

  if (workFilterId) {
    nextQuery.obraFiltro = workFilterId;
  } else {
    delete nextQuery.obraFiltro;
  }

  if (projectFilterId) {
    nextQuery.projetoFiltro = projectFilterId;
  } else {
    delete nextQuery.projetoFiltro;
  }

  router.replace({ query: nextQuery });
});

const clearFilters = () => {
  searchTerm.value = '';
  selectedWorkFilterId.value = '';
  selectedProjectFilterId.value = '';
  selectedCategory.value = '';
};

/* Abre o modal de preview do anexo */
const openPreview = (attachment) => {
  if (!attachment.href || attachment.href === '#') return;
  previewAttachment.value = attachment;
};

/* Fecha o modal de preview */
const closePreview = () => {
  previewAttachment.value = null;
};

/* Fecha o modal com a tecla ESC */
const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && previewAttachment.value) {
    closePreview();
  }
};

/* Adiciona/remove listener da tecla ESC quando modal abre/fecha */
watch(previewAttachment, (newValue) => {
  if (typeof window === 'undefined') return;
  if (newValue) {
    window.addEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = 'hidden';
  } else {
    window.removeEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = '';
  }
});

/* Previne navegação caso href esteja vazio */
const handleDownloadClick = (event, attachment) => {
  if (!attachment.href || attachment.href === '#') {
    event.preventDefault();
  }
};

/* Detecta se o anexo é uma imagem pela extensão */
const isImage = (attachment) => {
  if (!attachment?.name) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.name);
};

/* Detecta se o anexo é um PDF pela extensão */
const isPdf = (attachment) => {
  if (!attachment?.name) return false;
  return /\.pdf$/i.test(attachment.name);
};

const categoryClass = (category) => {
  const normalizedCategory = category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  return `category-chip--${normalizedCategory}`;
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

.table-card {
  padding: 0;
}

.table {
  display: grid;
  overflow-x: auto;
  scrollbar-width: thin;
}

.table__head,
.table__row {
  display: grid;
  min-width: 1040px;
  grid-template-columns:
    minmax(220px, 1.15fr)
    minmax(210px, 1.08fr)
    minmax(180px, 0.9fr)
    minmax(130px, 0.65fr)
    minmax(220px, 1fr);
  gap: 14px;
  align-items: center;
}

.table__head {
  padding: 16px 24px;
  border-bottom: 1px solid var(--stroke-soft);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 700;
  color: #7f8aa3;
  background: linear-gradient(180deg, rgba(246, 249, 255, 0.98), rgba(241, 246, 255, 0.92));
}

.table__row {
  padding: 18px 24px;
  border-bottom: 1px solid var(--stroke-soft);
  background: rgba(255, 255, 255, 0.72);
}

.table__row:last-child {
  border-bottom: none;
}

.table__empty {
  padding: 18px 24px;
  color: var(--muted);
}

.table__cell {
  min-width: 0;
}

.table__cell--title {
  color: var(--text-strong);
  font-weight: 700;
}

.table__cell--linked {
  color: var(--primary);
  font-weight: 600;
}

.attachment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(0, 74, 232, 0.16);
  border-radius: 8px;
  color: var(--primary);
  background: rgba(0, 74, 232, 0.06);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.attachment-action:hover {
  background: rgba(0, 74, 232, 0.12);
}

.attachment-action--download {
  background: rgba(0, 163, 74, 0.08);
  border-color: rgba(0, 163, 74, 0.18);
  color: #087443;
}

.attachment-action--download:hover {
  background: rgba(0, 163, 74, 0.16);
}

.category-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 8px;
  color: #1450c8;
  border: 1px solid rgba(0, 74, 232, 0.16);
  background: rgba(0, 74, 232, 0.08);
  font-size: 12px;
  font-weight: 800;
}

.category-chip--nota-fiscal,
.category-chip--romaneio,
.category-chip--logistica,
.category-chip--pedido-de-compra {
  color: #087443;
  border-color: rgba(0, 163, 74, 0.18);
  background: rgba(0, 163, 74, 0.1);
}

.category-chip--cronograma,
.category-chip--orcamento,
.category-chip--proposta-comercial,
.category-chip--art,
.category-chip--memorial-de-calculo {
  color: #a36715;
  border-color: rgba(183, 121, 31, 0.22);
  background: rgba(183, 121, 31, 0.1);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.pagination span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.pagination button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(0, 74, 232, 0.16);
  border-radius: 8px;
  color: var(--primary);
  background: rgba(0, 74, 232, 0.06);
  font-weight: 700;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* ========== MODAL DE PREVIEW ========== */

.preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(5, 8, 102, 0.58);
  backdrop-filter: blur(4px);
  animation: backdrop-fade-in 0.2s ease;
}

@keyframes backdrop-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.preview-modal {
  display: grid;
  grid-template-rows: auto 1fr;
  width: min(1100px, 100%);
  height: min(85vh, 900px);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 30px 80px rgba(5, 8, 102, 0.32);
  overflow: hidden;
  animation: modal-slide-up 0.25s ease;
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  padding: 22px 26px;
  border-bottom: 1px solid var(--stroke-soft);
  background: linear-gradient(180deg, #ffffff, #f7f9fc);
}

.preview-modal__info {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.preview-modal__info h3 {
  color: var(--text-strong);
  font-size: 19px;
  font-weight: 800;
  line-height: 1.3;
  word-break: break-word;
}

.preview-modal__info p {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.preview-modal__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.preview-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.preview-action:hover {
  transform: translateY(-1px);
}

.preview-action--download {
  background: linear-gradient(180deg, #0aa757, #087443);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 163, 74, 0.28);
}

.preview-action--download:hover {
  background: linear-gradient(180deg, #0eb763, #0a8a4f);
}

.preview-action--large {
  min-height: 46px;
  padding: 0 22px;
  font-size: 15px;
}

.preview-action--close {
  width: 40px;
  padding: 0;
  border-color: var(--stroke-soft);
  color: var(--text-strong);
  background: #ffffff;
}

.preview-action--close:hover {
  background: #f5f7fb;
  border-color: rgba(5, 8, 102, 0.16);
}

.preview-modal__body {
  display: grid;
  place-items: stretch;
  overflow: hidden;
  background: #f4f6fa;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #ffffff;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.preview-fallback {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  padding: 40px;
  text-align: center;
}

.preview-fallback__icon {
  color: var(--primary);
  font-size: 56px;
}

.preview-fallback h4 {
  color: var(--text-strong);
  font-size: 19px;
  font-weight: 800;
}

.preview-fallback p {
  max-width: 380px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 920px) {
  .table__head {
    display: none;
  }

  .table__row {
    min-width: 0;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .attachment-actions,
  .pagination {
    justify-content: stretch;
  }

  .attachment-actions > *,
  .pagination button {
    flex: 1;
  }

  .preview-backdrop {
    padding: 0;
  }

  .preview-modal {
    width: 100%;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }

  .preview-modal__header {
    padding: 16px 18px;
  }

  .preview-modal__info h3 {
    font-size: 16px;
  }

  .preview-action span:last-child {
    display: none;
  }

  .preview-action--download {
    width: 44px;
    padding: 0;
  }
}
</style>