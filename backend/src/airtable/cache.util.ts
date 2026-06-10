import { Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  /* Tempo de vida padrão em milissegundos */
  defaultTtlMs?: number;
  /* Limite máximo de entradas (LRU eviction) */
  maxSize?: number;
}

/* Cache em memória com TTL e proteção contra cache stampede.
   Características:
   - TTL configurável por entrada
   - Eviction LRU quando atinge o limite
   - Request coalescing: chamadas concorrentes para a mesma chave
     compartilham a mesma Promise (evita stampede) */
export class MemoryCache {
  private readonly logger = new Logger(MemoryCache.name);
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly inFlight = new Map<string, Promise<any>>();
  private readonly defaultTtlMs: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs ?? 60_000; // 60s padrão
    this.maxSize = options.maxSize ?? 500;
  }

  /* Retorna o valor do cache, ou executa a operação e guarda o resultado.
     Se múltiplas chamadas concorrentes pedirem a mesma chave, todas
     compartilham a mesma execução (request coalescing). */
  async getOrSet<T>(
    key: string,
    operation: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    /* 1. Cache HIT: retorna direto se ainda válido */
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Cache HIT: ${key}`);
      return cached.value;
    }

    /* 2. Já existe uma requisição em voo para essa chave: aguarda ela */
    const inFlightPromise = this.inFlight.get(key);
    if (inFlightPromise) {
      this.logger.debug(`Cache COALESCED: ${key}`);
      return inFlightPromise;
    }

    /* 3. Cache MISS: executa, armazena e retorna */
    this.logger.debug(`Cache MISS: ${key}`);
    const promise = this.executeAndStore(key, operation, ttlMs);
    this.inFlight.set(key, promise);

    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  /* Remove uma entrada específica do cache. */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /* Remove todas as entradas que começam com um prefixo.
     Útil para invalidar grupos relacionados (ex: 'budgets:*'). */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /* Limpa todo o cache. */
  clear(): void {
    this.cache.clear();
  }

  /* Executa a operação, armazena o resultado com TTL e gerencia o tamanho. */
  private async executeAndStore<T>(
    key: string,
    operation: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    const value = await operation();

    /* Eviction LRU: se passou do limite, remove a entrada mais antiga */
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });

    return value;
  }
}