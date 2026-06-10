<template>
  <div class="page">
    <section class="metric-grid">
      <BaseCard v-for="card in accessSummary" :key="card.label" class="metric-card">
        <p class="pill">{{ card.label }}</p>
        <strong class="metric-card__value" :style="{ color: card.accent }">{{ card.value }}</strong>
        <p>{{ card.detail }}</p>
      </BaseCard>
    </section>

    <section class="access-layout">
      <BaseCard class="table-card">
        <template #header>
          <div class="table-card__header">
            <p class="pill">Revisão de escopos</p>
            <h3>Perfis monitorados</h3>
          </div>
        </template>

        <FiltersBar
          :count="filteredProfiles.length"
          :total="accessProfiles.length"
          label="perfis"
          :show-clear="Boolean(searchTerm || selectedStatus)"
          @clear="clearFilters"
        >
          <BaseInput v-model="searchTerm" label="Buscar" placeholder="Perfil, conta ou escopo" tone="light" />
          <BaseSelect v-model="selectedStatus" label="Status" :options="statusOptions" tone="light" />
        </FiltersBar>

        <div class="table">
          <div class="table__head">
            <span>Perfil</span>
            <span>Conta</span>
            <span>Escopo liberado</span>
            <span>Status</span>
            <span>Última revisão</span>
          </div>

          <div class="table__body">
            <div v-for="item in filteredProfiles" :key="`${item.profile}-${item.owner}`" class="table__row">
              <span class="table__cell table__cell--title">{{ item.profile }}</span>
              <span class="table__cell">{{ item.owner }}</span>
              <span class="table__cell">{{ item.scope }}</span>
              <span class="table__cell">
                <span class="status-badge" :class="`status-badge--${item.tone}`">{{ item.status }}</span>
              </span>
              <span class="table__cell">{{ item.reviewedAt }}</span>
            </div>

            <p v-if="!filteredProfiles.length" class="table__empty">Nenhum perfil encontrado com os filtros atuais.</p>
          </div>
        </div>
      </BaseCard>
    </section>

    <BaseCard>
      <template #header>
        <div>
          <p class="pill">Controles aplicados</p>
          <h3>Políticas de acesso</h3>
        </div>
      </template>

      <ul class="rules">
        <li v-for="rule in securityRules" :key="rule">
          {{ rule }}
        </li>
      </ul>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import BaseSelect from '@/components/common/BaseSelect.vue';
import FiltersBar from '@/components/common/FiltersBar.vue';
import { getAdminPortalData } from '@/services/portalData';
import { matchesSearch, uniqueTextOptions } from '@/utils/text';

const { accessSummary, accessProfiles, securityRules } = getAdminPortalData();
const searchTerm = ref('');
const selectedStatus = ref('');

const statusOptions = computed(() => [
  { label: 'Todos os status', value: '' },
  ...uniqueTextOptions(accessProfiles.map((item) => item.status)).map((status) => ({
    label: status,
    value: status,
  })),
]);

const filteredProfiles = computed(() =>
  accessProfiles.filter(
    (item) =>
      (!selectedStatus.value || item.status === selectedStatus.value) &&
      matchesSearch([item.profile, item.owner, item.scope, item.status, item.reviewedAt], searchTerm.value),
  ),
);

const clearFilters = () => {
  searchTerm.value = '';
  selectedStatus.value = '';
};
</script>

<style scoped>
.metric-card__value {
  display: block;
  margin-top: 10px;
  font-size: 30px;
}

.access-layout {
  display: block;
}

.table-card {
  padding: 0;
}

.table-card__header {
  display: grid;
  gap: 8px;
}

.table-card :deep(.card__header) {
  padding: 22px 22px 0;
}

.table-card :deep(.card__body) {
  gap: 18px;
  padding: 0 22px 22px;
}

.table {
  display: grid;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns: 0.7fr 1fr 1.4fr 0.8fr 0.7fr;
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

.table__empty {
  padding: 18px 22px;
  color: var(--muted);
}

.table__cell--title,
.rules strong {
  color: var(--text-strong);
}

.table__cell--title {
  font-weight: 600;
}

.rules {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.rules li {
  position: relative;
  padding-left: 18px;
}

.rules li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
}

@media (max-width: 980px) {
  .table__head {
    display: none;
  }

  .table__row {
    grid-template-columns: 1fr;
  }

  .table-card :deep(.card__header),
  .table-card :deep(.card__body) {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
