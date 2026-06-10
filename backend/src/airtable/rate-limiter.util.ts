import { Logger } from '@nestjs/common';

interface RateLimiterOptions {
  /* Máximo de operações por janela de tempo */
  maxRequests: number;
  /* Tamanho da janela em milissegundos */
  windowMs: number;
}

/* Rate Limiter com janela deslizante (sliding window).
   Garante que no máximo `maxRequests` operações sejam executadas
   dentro de qualquer janela de `windowMs` milissegundos.
   Operações que excederem o limite ficam aguardando até liberar espaço.*/
export class RateLimiter {
  private readonly logger = new Logger(RateLimiter.name);
  private readonly timestamps: number[] = [];
  private readonly queue: (() => void)[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  /* Executa uma operação respeitando o rate limit.
     Se o limite estiver atingido, aguarda automaticamente. */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    return operation();
  }

  /* Aguarda até que haja um "slot" disponível na janela atual. */
  private async acquireSlot(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        this.cleanExpiredTimestamps();

        if (this.timestamps.length < this.maxRequests) {
          /* Há slot disponível: registra e libera */
          this.timestamps.push(Date.now());
          resolve();
        } else {
          /* Sem slot: calcula quando o mais antigo expira */
          const oldest = this.timestamps[0];
          const waitTime = Math.max(0, oldest + this.windowMs - Date.now() + 10);
          setTimeout(tryAcquire, waitTime);
        }
      };

      tryAcquire();
    });
  }

  /* Remove timestamps que saíram da janela atual. */
  private cleanExpiredTimestamps(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }
}