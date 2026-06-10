import { ref, onMounted } from 'vue';
import { useSession } from '@/composables/useSession';
import { getClientPortalData } from '@/services/portalData';

/* Composable que carrega os dados do portal do cliente do backend.
   Expõe estados de loading e erro além dos dados. */
export function useClientPortalData() {
  const { currentProfile } = useSession();

  // Estado inicial vazio com a forma esperada pelas telas
  const portalData = ref({
    company: { name: '', cityState: '', primaryContact: '', primaryEmail: '', primaryPhone: '' },
    works: [],
    projects: [],
    deliveries: [],
    attachments: [],
    summaryCards: [],
    readOnlyRules: [],
  });

  const isLoading = ref(true);
  const error = ref('');

  async function loadData() {
    isLoading.value = true;
    error.value = '';

    try {
      portalData.value = await getClientPortalData();
    } catch (err) {
      error.value = err.message || 'Erro ao carregar dados.';
      console.error('[useClientPortalData]', err);
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    loadData();
  });

  return {
    currentProfile,
    portalData,
    isLoading,
    error,
    reload: loadData,
  };
}