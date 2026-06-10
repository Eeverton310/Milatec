<template>
  <div class="page">
    <section class="metric-grid">
      <BaseCard v-for="card in summaryCards" :key="card.label">
        <p class="pill">{{ card.label }}</p>
        <strong class="metric-value" :style="{ color: card.accent }">{{ card.value }}</strong>
        <p>{{ card.detail }}</p>
      </BaseCard>
    </section>

    <FiltersBar
      :count="filteredCustomers.length"
      :total="customers.length"
      label="empresas"
      :show-clear="Boolean(searchTerm)"
      @clear="searchTerm = ''"
    >
      <BaseInput
        v-model="searchTerm"
        label="Buscar"
        placeholder="Empresa, cidade, contato, e-mail ou telefone"
        tone="light"
      />
    </FiltersBar>

    <BaseCard class="table-card">
      <div class="table">
        <div class="table__head">
          <span>Empresa</span>
          <span>Cidade e estado</span>
          <span>Contato principal</span>
          <span>E-mail</span>
          <span>Valor total</span>
        </div>

        <div class="table__body">
          <button
            v-for="customer in filteredCustomers"
            :key="customer.id"
            type="button"
            class="table__row table__row--interactive"
            @click="openDetail(customer)"
          >
            <span class="table__cell table__cell--title">
              <strong>{{ customer.company }}</strong>
              <small>{{ customer.workCount }} obras · {{ customer.projectCount }} projetos</small>
            </span>
            <span class="table__cell">{{ customer.cityState }}</span>
            <span class="table__cell">{{ customer.primaryContact }}</span>
            <span class="table__cell">{{ customer.email }}</span>
            <span class="table__cell table__cell--value">{{ customer.totalProjectValue }}</span>
          </button>

          <p v-if="!filteredCustomers.length" class="table__empty">Nenhuma empresa encontrada com os filtros atuais.</p>
        </div>
      </div>
    </BaseCard>

    <div v-if="selectedCustomer" class="modal-backdrop" role="presentation" @click.self="closeDetail">
      <section
        class="detail-modal customer-record-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Detalhes da empresa ${selectedCustomer.company}`"
      >
        <header class="customer-record-modal__header">
          <div>
            <h3>{{ selectedCustomer.company }}</h3>
            <p>{{ selectedCustomer.cityState }} · {{ selectedCustomer.primaryContact }}</p>
          </div>

          <div class="customer-record-modal__actions">
            <button class="record-icon-button" type="button" aria-label="Copiar resumo" @click="copyDetail">
              <span class="material-icons" aria-hidden="true">link</span>
            </button>
            <button class="record-icon-button" type="button" aria-label="Fechar detalhe" @click="closeDetail">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>
        </header>

        <div class="customer-record-content">
          <section class="customer-record-section">
            <div class="customer-info-grid">
              <div class="customer-field">
                <span>Empresa</span>
                <strong>{{ selectedCustomer.company }}</strong>
              </div>
              <div class="customer-field">
                <span>Cidade e estado</span>
                <strong>{{ selectedCustomer.cityState }}</strong>
              </div>
              <div class="customer-field">
                <span>Contato principal</span>
                <strong>{{ selectedCustomer.primaryContact }}</strong>
              </div>
              <div class="customer-field">
                <span>E-mail</span>
                <strong>{{ selectedCustomer.email }}</strong>
              </div>
              <div class="customer-field">
                <span>Telefone</span>
                <strong>{{ displayValue(selectedCustomer.phone) }}</strong>
              </div>
              <div class="customer-field">
                <span>Valor total dos projetos</span>
                <strong>{{ selectedCustomer.totalProjectValue }}</strong>
              </div>
            </div>

            <div class="customer-metrics-grid">
              <div class="customer-metric-card">
                <span>Obras</span>
                <strong>{{ selectedCustomer.workCount }}</strong>
              </div>
              <div class="customer-metric-card">
                <span>Projetos</span>
                <strong>{{ selectedCustomer.projectCount }}</strong>
              </div>
              <div class="customer-metric-card">
                <span>Entregas</span>
                <strong>{{ selectedCustomer.deliveryCount }}</strong>
              </div>
              <div class="customer-metric-card">
                <span>Anexos</span>
                <strong>{{ selectedCustomer.attachmentCount }}</strong>
              </div>
            </div>
          </section>

          <section class="customer-record-section">
            <div class="section-header">
              <h4>Obras vinculadas</h4>
              <span class="section-count">{{ selectedCustomer.workCount }}</span>
            </div>

            <div class="record-table">
              <div class="record-table__head record-table__head--works">
                <span>Obra</span>
                <span>Cidade</span>
                <span>Etapa</span>
                <span>Projetos</span>
                <span>Entregas</span>
              </div>

              <div
                v-for="work in selectedCustomer.linkedWorks"
                :key="work.id"
                class="record-table__row record-table__row--works"
              >
                <strong>{{ work.name }}</strong>
                <span>{{ work.city }}</span>
                <span>{{ work.stage }}</span>
                <span>{{ work.projectCount }}</span>
                <span>{{ work.deliveryCount }}</span>
              </div>

              <p v-if="!selectedCustomer.linkedWorks.length" class="record-empty">Sem obras vinculadas.</p>
            </div>
          </section>

          <section class="customer-record-section">
            <div class="record-dual-grid">
              <div class="record-panel">
                <div class="section-header">
                  <h4>Projetos</h4>
                  <span class="section-count">{{ selectedCustomer.projectCount }}</span>
                </div>

                <div class="mini-list">
                  <div
                    v-for="project in selectedCustomer.linkedProjects"
                    :key="project.id"
                    class="mini-list__item"
                  >
                    <strong>{{ project.name }}</strong>
                    <span>{{ project.workName }}</span>
                    <small>{{ project.stage }} · {{ project.totalValue }}</small>
                  </div>

                  <p v-if="!selectedCustomer.linkedProjects.length" class="record-empty">Sem projetos vinculados.</p>
                </div>
              </div>

              <div class="record-panel">
                <div class="section-header">
                  <h4>Entregas</h4>
                  <span class="section-count">{{ selectedCustomer.deliveryCount }}</span>
                </div>

                <div class="mini-list">
                  <div
                    v-for="delivery in selectedCustomer.linkedDeliveries"
                    :key="delivery.id"
                    class="mini-list__item"
                  >
                    <strong>{{ delivery.name }}</strong>
                    <span>{{ delivery.workName }}</span>
                    <small>{{ delivery.date }} · {{ delivery.status }}</small>
                  </div>

                  <p v-if="!selectedCustomer.linkedDeliveries.length" class="record-empty">Sem entregas vinculadas.</p>
                </div>
              </div>
            </div>
          </section>

          <section class="customer-record-section">
            <div class="section-header">
              <h4>Anexos vinculados</h4>
              <span class="section-count">{{ selectedCustomer.attachmentCount }}</span>
            </div>

            <div class="attachment-list">
              <a
                v-for="attachment in selectedCustomer.linkedAttachments"
                :key="attachment.id"
                :href="attachment.href"
                class="attachment-row"
                :aria-label="attachment.actionLabel"
              >
                <div class="attachment-row__meta">
                  <strong>{{ attachment.name }}</strong>
                  <span>{{ attachment.linkedTypeLabel }} · {{ attachment.linkedRecordName }}</span>
                </div>
                <small>{{ attachment.category }} · {{ attachment.uploadedAt }}</small>
              </a>

              <p v-if="!selectedCustomer.linkedAttachments.length" class="record-empty">Sem anexos vinculados.</p>
            </div>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import FiltersBar from '@/components/common/FiltersBar.vue';
import { getAdminPortalData } from '@/services/portalData';
import { matchesSearch } from '@/utils/text';

const { summaryCards, customers } = getAdminPortalData();
const searchTerm = ref('');
const selectedCustomerId = ref('');

const filteredCustomers = computed(() =>
  customers.filter((customer) =>
    matchesSearch(
      [customer.company, customer.cityState, customer.primaryContact, customer.email, customer.phone],
      searchTerm.value,
    ),
  ),
);

const selectedCustomer = computed(() => customers.find((customer) => customer.id === selectedCustomerId.value) || null);

const openDetail = (customer) => {
  selectedCustomerId.value = customer.id;
};

const closeDetail = () => {
  selectedCustomerId.value = '';
};

const displayValue = (value) => value || '-';

const copyDetail = async () => {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !selectedCustomer.value) return;

  const summary = [
    selectedCustomer.value.company,
    selectedCustomer.value.cityState,
    selectedCustomer.value.primaryContact,
    selectedCustomer.value.email,
  ].join(' - ');

  await navigator.clipboard.writeText(summary);
};
</script>

<style scoped>
.metric-value {
  display: block;
  margin-top: 10px;
  font-size: 30px;
}

.table-card {
  padding: 0;
}

.table {
  display: grid;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.1fr)
    minmax(180px, 0.78fr)
    minmax(180px, 0.78fr)
    minmax(220px, 0.95fr)
    minmax(150px, 0.72fr);
  gap: 14px;
  align-items: center;
}

.table__head {
  padding: 18px 22px;
  border-bottom: 1px solid var(--stroke);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}

.table__row {
  padding: 18px 22px;
  border-bottom: 1px solid var(--stroke);
}

.table__row:last-child {
  border-bottom: none;
}

.table__row--interactive {
  width: 100%;
  appearance: none;
  border: 0;
  border-bottom: 1px solid var(--stroke);
  color: inherit;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.table__row--interactive:last-child {
  border-bottom: none;
}

.table__row--interactive:hover,
.table__row--interactive:focus-visible {
  z-index: 1;
  background: #f6f9ff;
  box-shadow: inset 4px 0 0 #004ae8;
  outline: none;
  transform: translateX(2px);
}

.table__empty {
  padding: 18px 22px;
  color: var(--muted);
}

.table__cell {
  min-width: 0;
  overflow-wrap: anywhere;
}

.table__cell--title {
  display: grid;
  gap: 4px;
  color: var(--text-strong);
}

.table__cell--title strong {
  font-size: 16px;
  font-weight: 700;
}

.table__cell--title small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}

.table__cell--value {
  color: var(--primary);
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

.detail-modal {
  width: min(1120px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--shadow-lg);
}

.customer-record-modal__header {
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

.customer-record-modal__header h3 {
  color: #202332;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.22;
  text-transform: uppercase;
}

.customer-record-modal__header p {
  margin-top: 8px;
  color: #687083;
  font-size: 13px;
  line-height: 1.5;
}

.customer-record-modal__actions {
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

.customer-record-content {
  display: grid;
  gap: 26px;
  padding: 18px 16px 28px;
  background: #ffffff;
}

.customer-record-section {
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid #edf1f7;
  border-radius: 8px;
  background: #f5f7fb;
}

.customer-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 18px 22px;
}

.customer-field,
.customer-metric-card {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.customer-field span,
.customer-metric-card span {
  color: #202332;
  font-size: 12px;
  font-weight: 700;
}

.customer-field strong,
.customer-metric-card strong {
  color: #202332;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.customer-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
}

.customer-metric-card {
  min-height: 78px;
  padding: 14px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: #ffffff;
}

.customer-metric-card strong {
  font-size: 28px;
  font-weight: 800;
  color: #050866;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.section-header h4 {
  color: #202332;
  font-size: 16px;
  font-weight: 800;
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: #0f172a;
  background: #e8edf8;
  font-size: 12px;
  font-weight: 700;
}

.record-table {
  display: grid;
  overflow-x: auto;
}

.record-table__head,
.record-table__row {
  display: grid;
  min-width: 860px;
  align-items: center;
  gap: 12px;
}

.record-table__head--works,
.record-table__row--works {
  grid-template-columns:
    minmax(180px, 1.2fr)
    minmax(180px, 1fr)
    minmax(160px, 0.9fr)
    minmax(100px, 0.55fr)
    minmax(100px, 0.55fr);
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
  min-height: 40px;
  border: 1px solid #dfe5ee;
  color: #a0a7b4;
  font-size: 12px;
  background: #ffffff;
}

.record-dual-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 12px;
}

.record-panel {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: #ffffff;
}

.mini-list {
  display: grid;
  gap: 10px;
}

.mini-list__item {
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf1f7;
}

.mini-list__item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.mini-list__item strong {
  color: #202332;
  font-size: 13px;
  font-weight: 700;
}

.mini-list__item span,
.mini-list__item small {
  color: #687083;
  font-size: 12px;
  line-height: 1.4;
}

.attachment-list {
  display: grid;
  gap: 10px;
}

.attachment-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  color: inherit;
  background: #ffffff;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.attachment-row:hover,
.attachment-row:focus-visible {
  border-color: rgba(0, 74, 232, 0.22);
  box-shadow: 0 10px 18px rgba(5, 8, 102, 0.08);
  outline: none;
  transform: translateY(-1px);
}

.attachment-row__meta {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.attachment-row__meta strong {
  color: #202332;
  font-size: 13px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.attachment-row__meta span,
.attachment-row small {
  color: #687083;
  font-size: 12px;
  line-height: 1.4;
}

.attachment-row small {
  text-align: right;
}

@media (max-width: 1040px) {
  .table__head {
    display: none;
  }

  .table__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .customer-info-grid,
  .customer-metrics-grid,
  .record-dual-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .modal-backdrop {
    padding: 0;
  }

  .detail-modal {
    width: 100%;
    max-height: 100vh;
    min-height: 100vh;
    border-radius: 0;
  }

  .customer-record-modal__header {
    padding: 22px 16px 16px;
  }

  .customer-record-modal__header h3 {
    font-size: 22px;
  }

  .customer-record-content {
    padding: 14px 10px 22px;
  }

  .attachment-row {
    display: grid;
  }

  .attachment-row small {
    text-align: left;
  }
}
</style>
