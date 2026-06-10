<template>
  <div class="page page--wide">
    <div v-if="isLoading" class="page-status page-status--loading">
      <span class="loader" aria-hidden="true"></span>
      <p>Carregando entregas...</p>
    </div>

    <div v-else-if="error" class="page-status page-status--error">
      <p>{{ error }}</p>
    </div>

    <template v-else>
    <div class="view-toggle" aria-label="Visualização de entregas">
      <button
        type="button"
        :class="{ 'view-toggle__button--active': viewMode === 'calendar' }"
        :aria-pressed="viewMode === 'calendar'"
        class="view-toggle__button"
        @click="viewMode = 'calendar'"
      >
        Calendário
      </button>
      <button
        type="button"
        :class="{ 'view-toggle__button--active': viewMode === 'table' }"
        :aria-pressed="viewMode === 'table'"
        class="view-toggle__button"
        @click="viewMode = 'table'"
      >
        Tabela
      </button>
    </div>

    <FiltersBar
      :count="filteredDeliveries.length"
      :total="deliveries.length"
      label="entregas"
      :show-clear="Boolean(searchTerm || selectedStage)"
      @clear="clearFilters"
    >
      <BaseInput v-model="searchTerm" label="Buscar" placeholder="Entrega, obra ou endereço" tone="light" />
      <BaseSelect v-model="selectedStage" label="Etapa" :options="stageOptions" tone="light" />
    </FiltersBar>

    <section v-if="viewMode === 'calendar'" class="calendar-panel">
      <header class="calendar-panel__header">
        <div>
          <p class="pill">Calendário de entregas</p>
          <h3>{{ calendarTitle }}</h3>
        </div>
        <span>{{ datedDeliveries.length }} entregas com data</span>
      </header>

      <div class="calendar-scroll">
        <div class="weekday-grid" aria-hidden="true">
          <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
        </div>

        <div class="calendar-grid">
          <div
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-day"
            :class="{ 'calendar-day--empty': day.empty }"
          >
            <span v-if="!day.empty" class="calendar-day__number">{{ day.day }}</span>
            <button
              v-for="delivery in day.deliveries"
              :key="delivery.id"
              type="button"
              class="calendar-event"
              @click="selectDelivery(delivery)"
            >
              {{ delivery.name }}
            </button>
          </div>
        </div>
      </div>

      <section v-if="unscheduledDeliveries.length" class="pending-list">
        <h4>Sem data agendada</h4>
        <button
          v-for="delivery in unscheduledDeliveries"
          :key="delivery.id"
          type="button"
          class="pending-item"
          @click="selectDelivery(delivery)"
        >
          {{ delivery.name }}
        </button>
      </section>

      <div v-if="!filteredDeliveries.length" class="calendar-empty">
        Nenhuma entrega encontrada com os filtros atuais.
      </div>
    </section>

    <section v-else class="table-card">
      <div class="table">
        <div class="table__head">
          <span>Nome</span>
          <span>Quantidade</span>
          <span>Data de faturamento</span>
          <span>Etapa</span>
          <span>Valor</span>
          <span>Anexo (nota fiscal)</span>
          <span>Obra vinculada</span>
        </div>

        <div class="table__body">
          <div
            v-for="delivery in paginatedDeliveries"
            :key="delivery.id"
            class="table__row"
            :class="{ 'table__row--pending-date': !delivery.hasDate }"
            role="button"
            tabindex="0"
            @click="selectDelivery(delivery)"
            @keydown.enter.prevent="selectDelivery(delivery)"
            @keydown.space.prevent="selectDelivery(delivery)"
          >
            <span class="table__cell table__cell--title">{{ delivery.name }}</span>
            <span class="table__cell">{{ delivery.quantity }}</span>
            <span class="table__cell">{{ delivery.invoiceDate }}</span>
            <span class="table__cell">
              <span class="status-badge" :class="`status-badge--${delivery.tone}`">
                {{ delivery.stage }}
              </span>
            </span>
            <span class="table__cell">{{ delivery.value }}</span>
            <span class="table__cell">
              <a
                v-if="delivery.invoiceAttachment"
                :href="delivery.invoiceAttachment.href"
                class="attachment-action"
                :aria-label="delivery.invoiceAttachment.actionLabel"
                @click.stop
              >
                <span class="material-icons" aria-hidden="true">receipt_long</span>
                <span>{{ delivery.invoiceAttachment.name }}</span>
              </a>
              <span v-else class="attachment-action attachment-action--disabled">
                <span class="material-icons" aria-hidden="true">hourglass_empty</span>
                <span>NF pendente</span>
              </span>
            </span>
            <span class="table__cell table__cell--linked">
              <button class="inline-link" type="button" @click.stop="goToWork(delivery.workId)">
                {{ delivery.workName }}
              </button>
            </span>
          </div>

          <p v-if="!paginatedDeliveries.length" class="table__empty">Nenhuma entrega encontrada com os filtros atuais.</p>
        </div>
      </div>

      <nav v-if="totalTablePages > 1" class="pagination" aria-label="Paginação de entregas">
        <button type="button" :disabled="currentTablePage === 1" @click="currentTablePage -= 1">
          Anterior
        </button>
        <span>Página {{ currentTablePage }} de {{ totalTablePages }}</span>
        <button type="button" :disabled="currentTablePage === totalTablePages" @click="currentTablePage += 1">
          Próxima
        </button>
      </nav>
    </section>

    <div
      v-if="selectedDelivery"
      class="modal-backdrop"
      role="presentation"
      @click.self="closeDetail"
    >
      <section
        class="detail-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Detalhes da entrega ${selectedDelivery.name}`"
      >
        <header class="detail-modal__header">
          <div>
            <p class="pill">Detalhe da entrega</p>
            <h3>{{ selectedDelivery.name }}</h3>
          </div>
          <button class="modal-close" type="button" aria-label="Fechar detalhe" @click="closeDetail">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="detail-grid">
          <div>
            <span>Nome</span>
            <strong>{{ selectedDelivery.name }}</strong>
          </div>
          <div>
            <span>Obra associada</span>
            <button class="detail-link" type="button" @click="goToWork(selectedDelivery.workId)">
              {{ selectedDelivery.workName }}
            </button>
          </div>
          <div>
            <span>Cidade</span>
            <strong>{{ selectedDelivery.workCity }}</strong>
          </div>
          <div>
            <span>Data entrega</span>
            <strong>{{ selectedDelivery.displayDate }}</strong>
          </div>
          <div>
            <span>Quantidade</span>
            <strong>{{ selectedDelivery.quantity }}</strong>
          </div>
          <div>
            <span>Etapa da entrega</span>
            <strong>{{ selectedDelivery.stage }}</strong>
          </div>
          <div>
            <span>Data faturamento</span>
            <strong>{{ selectedDelivery.invoiceDate }}</strong>
          </div>
          <div>
            <span>Endereço de entrega</span>
            <strong>{{ selectedDelivery.deliveryAddress }}</strong>
          </div>
          <div>
            <span>Valor</span>
            <strong>{{ selectedDelivery.value }}</strong>
          </div>
        </div>

        <section class="detail-section">
          <h4>Documentos</h4>
          <div class="document-list">
            <div v-for="item in deliveryDocumentRows(selectedDelivery)" :key="item.label" class="document-item">
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
              <strong v-else>Pendente</strong>
            </div>
          </div>
        </section>
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
import { matchesSearch, uniqueTextOptions } from '@/utils/text';

const route = useRoute();
const router = useRouter();
const { portalData, isLoading, error } = useClientPortalData();
const viewMode = ref('calendar');
const selectedDeliveryId = ref('');
const currentTablePage = ref(1);
const searchTerm = ref('');
const selectedStage = ref('');
const tablePageSize = 8;

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const deliveries = computed(() => portalData.value.deliveries);
const stageOptions = computed(() => [
  { label: 'Todas as etapas', value: '' },
  ...uniqueTextOptions(deliveries.value.map((delivery) => delivery.stage)).map((stage) => ({
    label: stage,
    value: stage,
  })),
]);
const filteredDeliveries = computed(() =>
  deliveries.value.filter(
    (delivery) =>
      (!selectedStage.value || delivery.stage === selectedStage.value) &&
      matchesSearch(
        [
          delivery.name,
          delivery.workName,
          delivery.deliveryAddress,
          delivery.stage,
          delivery.invoiceDate,
        ],
        searchTerm.value,
      ),
  ),
);
const selectedDelivery = computed(
  () => deliveries.value.find((delivery) => delivery.id === selectedDeliveryId.value) || null,
);
const totalTablePages = computed(() => Math.max(1, Math.ceil(filteredDeliveries.value.length / tablePageSize)));
const paginatedDeliveries = computed(() => {
  const start = (currentTablePage.value - 1) * tablePageSize;
  return filteredDeliveries.value.slice(start, start + tablePageSize);
});
const datedDeliveries = computed(() => filteredDeliveries.value.filter((delivery) => delivery.hasDate));
const unscheduledDeliveries = computed(() => filteredDeliveries.value.filter((delivery) => !delivery.hasDate));

const calendarMonth = computed(() => {
  const dates = datedDeliveries.value
    .map((delivery) => parseBrDate(delivery.date))
    .filter(Boolean)
    .sort((dateA, dateB) => dateA - dateB);
  const baseDate = dates[0] || new Date();

  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
});

const calendarTitle = computed(() =>
  calendarMonth.value.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  }),
);

const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear();
  const month = calendarMonth.value.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday }, (_, index) => ({
    key: `empty-${index}`,
    empty: true,
    deliveries: [],
  }));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);

    cells.push({
      key: dateKey,
      day,
      empty: false,
      deliveries: filteredDeliveries.value.filter((delivery) => getDeliveryDateKey(delivery) === dateKey),
    });
  }

  return cells;
});

function parseBrDate(value) {
  if (!value) return null;

  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDeliveryDateKey(delivery) {
  const parsedDate = parseBrDate(delivery.date);
  return parsedDate ? formatDateKey(parsedDate) : '';
}

watch(
  () => route.query.entrega,
  (deliveryId) => {
    selectedDeliveryId.value = typeof deliveryId === 'string' ? deliveryId : '';
  },
  { immediate: true },
);

watch(filteredDeliveries, () => {
  if (currentTablePage.value > totalTablePages.value) currentTablePage.value = totalTablePages.value;
});

const clearFilters = () => {
  searchTerm.value = '';
  selectedStage.value = '';
};

const selectDelivery = (delivery) => {
  selectedDeliveryId.value = delivery.id;
  router.replace({ query: { ...route.query, entrega: delivery.id } });
};

const closeDetail = () => {
  selectedDeliveryId.value = '';
  const { entrega, ...query } = route.query;
  router.replace({ query });
};

const goToWork = (workId) => {
  router.push({ path: '/cliente/obras', query: { obra: workId } });
};

const deliveryDocumentRows = (delivery) => [
  {
    label: 'Pedido de Compra (anexo)',
    attachment: delivery.purchaseOrderAttachment,
  },
  {
    label: 'Romaneio (PDF)',
    attachment: delivery.packingListAttachment,
  },
  {
    label: 'Nota fiscal',
    attachment: delivery.invoiceAttachment,
  },
];

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
.view-toggle {
  display: inline-flex;
  justify-self: start;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--stroke-soft);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 24px rgba(5, 8, 102, 0.07);
}

.view-toggle__button {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
  font-weight: 700;
  cursor: pointer;
}

.view-toggle__button--active {
  color: var(--primary);
  border-color: rgba(0, 74, 232, 0.18);
  background: rgba(0, 74, 232, 0.08);
}

.calendar-panel,
.table-card {
  border: 1px solid var(--stroke-soft);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 16px 34px rgba(5, 8, 102, 0.08);
  overflow: hidden;
}

.calendar-panel {
  display: grid;
  gap: 0;
}

.calendar-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid var(--stroke-soft);
  background: linear-gradient(180deg, rgba(246, 249, 255, 0.98), rgba(241, 246, 255, 0.92));
}

.calendar-panel__header h3 {
  margin-top: 8px;
  color: var(--text-strong);
  text-transform: capitalize;
}

.calendar-panel__header > span {
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
}

.calendar-scroll {
  overflow-x: auto;
}

.calendar-empty {
  padding: 20px;
  color: var(--muted);
}

.weekday-grid,
.calendar-grid {
  display: grid;
  min-width: 820px;
  grid-template-columns: repeat(7, minmax(110px, 1fr));
}

.weekday-grid {
  border-bottom: 1px solid var(--stroke-soft);
  background: rgba(246, 249, 255, 0.72);
}

.weekday-grid span {
  padding: 12px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.calendar-day {
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 126px;
  padding: 10px;
  border-right: 1px solid var(--stroke-soft);
  border-bottom: 1px solid var(--stroke-soft);
  background: #ffffff;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day--empty {
  background: rgba(246, 249, 255, 0.5);
}

.calendar-day__number {
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 700;
}

.calendar-event,
.pending-item {
  width: 100%;
  border: 1px solid rgba(0, 74, 232, 0.16);
  border-radius: 8px;
  color: var(--primary);
  background: rgba(0, 74, 232, 0.07);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
}

.calendar-event {
  min-height: 40px;
  padding: 8px;
}

.pending-list {
  display: grid;
  gap: 10px;
  padding: 18px 20px 20px;
}

.pending-list h4 {
  margin: 0;
  color: var(--text-strong);
  font-size: 16px;
}

.pending-item {
  min-height: 42px;
  padding: 0 12px;
  color: #a36715;
  border-color: rgba(183, 121, 31, 0.2);
  background: rgba(183, 121, 31, 0.1);
}

.table {
  display: grid;
  overflow-x: auto;
  scrollbar-width: thin;
}

.table__head,
.table__row {
  display: grid;
  min-width: 1180px;
  grid-template-columns:
    minmax(170px, 1.1fr)
    minmax(120px, 0.75fr)
    minmax(150px, 0.85fr)
    minmax(190px, 1.05fr)
    minmax(130px, 0.78fr)
    minmax(170px, 1fr)
    minmax(210px, 1.15fr);
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
  position: relative;
  padding: 18px 24px;
  border-bottom: 1px solid var(--stroke-soft);
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.table__row:hover,
.table__row:focus-visible {
  background: #f7faff;
  transform: translateY(-1px);
  box-shadow: inset 0 0 0 1px rgba(20, 80, 200, 0.08), 0 12px 24px rgba(5, 8, 102, 0.08);
  outline: none;
}

.table__row:last-child {
  border-bottom: none;
}

.table__empty {
  padding: 18px 24px;
  color: var(--muted);
}

.table__row--pending-date {
  background: rgba(183, 121, 31, 0.08);
  box-shadow: inset 4px 0 0 rgba(183, 121, 31, 0.7);
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

.inline-link,
.detail-link {
  padding: 0;
  border: none;
  text-align: left;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.inline-link:hover,
.inline-link:focus-visible,
.detail-link:hover,
.detail-link:focus-visible {
  color: var(--primary);
  outline: none;
}

.table__cell .attachment-action {
  max-width: 100%;
  justify-content: flex-start;
  border-radius: 8px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--stroke-soft);
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

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(5, 8, 102, 0.48);
}

.detail-modal {
  display: grid;
  gap: 18px;
  width: min(820px, 100%);
  max-height: min(820px, calc(100vh - 48px));
  overflow: auto;
  padding: 22px;
  border-radius: 8px;
  background: var(--card);
  box-shadow: var(--shadow-lg);
}

.detail-modal__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.detail-modal__header h3 {
  margin-top: 8px;
  color: var(--text-strong);
  font-size: 24px;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--stroke-soft);
  border-radius: 8px;
  color: var(--text-strong);
  background: #f7faff;
  cursor: pointer;
}

.modal-close:hover,
.modal-close:focus-visible {
  border-color: rgba(0, 74, 232, 0.24);
  color: var(--primary);
  outline: none;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.detail-grid div,
.document-item {
  min-height: 92px;
  padding: 14px;
  border: 1px solid var(--stroke-soft);
  border-radius: 8px;
  background: #f7faff;
}

.detail-grid span,
.detail-grid strong,
.document-item span,
.document-item strong {
  display: block;
}

.detail-grid span,
.document-item > span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.detail-grid strong,
.document-item strong {
  margin-top: 8px;
  color: var(--text-strong);
  font-size: 16px;
  line-height: 1.4;
}

.detail-link {
  display: block;
  margin-top: 8px;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.detail-section {
  display: grid;
  gap: 12px;
}

.detail-section h4 {
  margin: 0;
  color: var(--text-strong);
  font-size: 16px;
}

.document-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.document-item {
  display: grid;
  gap: 10px;
}

.document-item .attachment-action {
  justify-content: flex-start;
  border-radius: 8px;
}

@media (max-width: 920px) {
  .calendar-panel__header {
    display: grid;
  }

  .table__head {
    display: none;
  }

  .table__row {
    min-width: 0;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .view-toggle {
    width: 100%;
  }

  .view-toggle__button {
    flex: 1;
  }

  .pagination {
    justify-content: stretch;
  }

  .pagination button {
    flex: 1;
  }

  .modal-backdrop {
    align-items: stretch;
    padding: 12px;
  }

  .detail-modal {
    max-height: calc(100vh - 24px);
  }
}
</style>


