<template>
  <div class="page">
    <FiltersBar
      :count="filteredAttachments.length"
      :total="attachments.length"
      label="anexos"
      :show-clear="Boolean(searchTerm || selectedCategory)"
      @clear="clearFilters"
    >
      <BaseInput v-model="searchTerm" label="Buscar" placeholder="Cliente, arquivo ou visibilidade" tone="light" />
      <BaseSelect v-model="selectedCategory" label="Categoria" :options="categoryOptions" tone="light" />
    </FiltersBar>

    <BaseCard class="table-card">
      <div class="table">
        <div class="table__head">
          <span>Cliente</span>
          <span>Nome do arquivo</span>
          <span>Categoria</span>
          <span>Data de upload</span>
          <span>Visibilidade</span>
          <span>Acesso</span>
        </div>

        <div class="table__body">
          <div
            v-for="attachment in filteredAttachments"
            :key="`${attachment.client}-${attachment.name}`"
            class="table__row"
          >
            <span class="table__cell table__cell--title">{{ attachment.client }}</span>
            <span class="table__cell">{{ attachment.name }}</span>
            <span class="table__cell">{{ attachment.category }}</span>
            <span class="table__cell">{{ attachment.uploadedAt }}</span>
            <span class="table__cell">{{ attachment.visibility }}</span>
            <span class="table__cell">
              <a
                :href="attachment.href"
                class="attachment-action"
                :class="{ 'attachment-action--disabled': attachment.actionLabel === 'Restringido' }"
                :aria-label="attachment.actionLabel"
              >
                <span class="material-icons" aria-hidden="true">{{ resolveActionIcon(attachment.actionLabel) }}</span>
                <span>{{ attachment.actionLabel }}</span>
              </a>
            </span>
          </div>

          <p v-if="!filteredAttachments.length" class="table__empty">Nenhum anexo encontrado com os filtros atuais.</p>
        </div>
      </div>
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

const { attachments } = getAdminPortalData();
const searchTerm = ref('');
const selectedCategory = ref('');

const categoryOptions = computed(() => [
  { label: 'Todas as categorias', value: '' },
  ...uniqueTextOptions(attachments.map((attachment) => attachment.category)).map((category) => ({
    label: category,
    value: category,
  })),
]);

const filteredAttachments = computed(() =>
  attachments.filter(
    (attachment) =>
      (!selectedCategory.value || attachment.category === selectedCategory.value) &&
      matchesSearch(
        [
          attachment.client,
          attachment.name,
          attachment.category,
          attachment.visibility,
          attachment.uploadedAt,
        ],
        searchTerm.value,
      ),
  ),
);

const clearFilters = () => {
  searchTerm.value = '';
  selectedCategory.value = '';
};

const resolveActionIcon = (actionLabel) => {
  const iconByAction = {
    Abrir: 'open_in_new',
    Baixar: 'download',
    Restringido: 'lock',
  };

  return iconByAction[actionLabel] || 'description';
};
</script>

<style scoped>
.table__head,
.table__row {
  display: grid;
  grid-template-columns: 1fr 1.1fr 0.7fr 0.8fr 0.8fr 0.6fr;
  gap: 14px;
  align-items: center;
}

.table__empty {
  padding: 18px 22px;
  color: var(--muted);
}

@media (max-width: 1160px) {
  .table__head {
    display: none;
  }

  .table__row {
    grid-template-columns: 1fr;
  }
}
</style>
