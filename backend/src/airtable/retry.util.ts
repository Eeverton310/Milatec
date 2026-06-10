import { Logger } from '@nestjs/common';

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
}

/* Status codes do HTTP que justificam retry (problemas temporários). */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/* Códigos de erro de rede que justificam retry. */
const RETRYABLE_ERROR_CODES = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENETUNREACH',
  'EAI_AGAIN',
];

/* Decide se um erro merece nova tentativa. */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  /* Timeout ou erro de rede */
  if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }

  /* Erro HTTP retryável (Airtable usa statusCode) */
  const statusCode = error.statusCode || error.status;
  if (statusCode && RETRYABLE_STATUS_CODES.includes(statusCode)) {
    return true;
  }

  /* Mensagem genérica de timeout */
  if (error.message && /timeout/i.test(error.message)) {
    return true;
  }

  return false;
}

/* Aplica jitter (variação aleatória) ao tempo de espera.
   Evita que múltiplas requisições retentem ao mesmo tempo. */
function applyJitter(delay: number, jitterFactor: number): number {
  const variation = delay * jitterFactor;
  return delay + (Math.random() * 2 - 1) * variation;
}

/* Pausa a execução por X milissegundos. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Executa uma operação com retry automático e backoff exponencial.
   @param operation Função assíncrona a executar
   @param context Nome da operação (usado em logs)
   @param options Configurações de retry */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 4,
    initialDelayMs = 1000,
    maxDelayMs = 8000,
    jitterFactor = 0.2,
  } = options;

  const logger = new Logger('RetryUtil');
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      /* Se o erro não é retryável, falha imediatamente */
      if (!isRetryableError(error)) {
        throw error;
      }

      /* Última tentativa: lança o erro */
      if (attempt === maxAttempts) {
        logger.error(
          `[${context}] Falhou após ${maxAttempts} tentativas. Último erro: ${error.message}`,
        );
        throw error;
      }

      /* Calcula delay com backoff exponencial */
      const baseDelay = Math.min(
        initialDelayMs * Math.pow(2, attempt - 1),
        maxDelayMs,
      );
      const delay = Math.max(0, applyJitter(baseDelay, jitterFactor));

      logger.warn(
        `[${context}] Tentativa ${attempt}/${maxAttempts} falhou (${error.message}). Retry em ${Math.round(delay)}ms.`,
      );

      await sleep(delay);
    }
  }

  /* Nunca chega aqui, mas TypeScript exige */
  throw lastError;
}