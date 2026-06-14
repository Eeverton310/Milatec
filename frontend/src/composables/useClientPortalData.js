import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSession } from '@/composables/useSession';
import { getClientPortalData } from '@/services/portalData';

/* Intervalo de atualização automática (ms). O backend tem cache de 60s,
   então buscar a cada 60s mantém a tela em dia sem chamadas redundantes. */
const REFRESH_INTERVAL_MS = 60_000;

/* Composable que carrega os dados do portal do cliente do backend.
   Expõe estados de loading e erro além dos dados.
   Atualiza automaticamente em segundo plano enquanto a aba está visível. */
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
  const isRefreshing = ref(false);

  let pollTimer = null;

  /* loadData: na primeira carga mostra o "carregando"; nas atualizações
     automáticas (silent = true) atualiza em segundo plano sem piscar a tela. */
  async function loadData(silent = false) {
    if (silent) {
      isRefreshing.value = true;
    } else {
      isLoading.value = true;
    }
    error.value = '';

    try {
      portalData.value = await getClientPortalData();
    } catch (err) {
      // Em atualização silenciosa, não derruba a tela com erro;
      // apenas registra e mantém os dados anteriores.
      if (!silent) {
        error.value = err.message || 'Erro ao carregar dados.';
      }
      console.error('[useClientPortalData]', err);
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => {
      // Só atualiza se a aba estiver visível (economiza requisições)
      if (typeof document === 'undefined' || !document.hidden) {
        loadData(true);
      }
    }, REFRESH_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  /* Quando o usuário volta para a aba, atualiza na hora. */
  function handleVisibilityChange() {
    if (!document.hidden) {
      loadData(true);
    }
  }

  onMounted(() => {
    loadData();
    startPolling();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  onBeforeUnmount(() => {
    stopPolling();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  return {
    currentProfile,
    portalData,
    isLoading,
    isRefreshing,
    error,
    reload: () => loadData(false),
  };
}