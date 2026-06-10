import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { withRetry } from './retry.util';
import { RateLimiter } from './rate-limiter.util';
import { MemoryCache } from './cache.util';

const Airtable = require('airtable');

interface QueryOptions {
  filterByFormula?: string;
  fields?: string[];
  maxRecords?: number;
  sort?: { field: string; direction?: 'asc' | 'desc' }[];
}

@Injectable()
export class AirtableService implements OnModuleInit {
  private readonly logger = new Logger(AirtableService.name);
  private base: any;

  /* Limite oficial do Airtable: 5 req/s. Usamos 4 com margem de segurança. */
  private readonly rateLimiter = new RateLimiter({
    maxRequests: 4,
    windowMs: 1000,
  });

  /* Cache de 60s para reduzir chamadas redundantes ao Airtable. */
  private readonly cache = new MemoryCache({
    defaultTtlMs: 60_000,
    maxSize: 500,
  });

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('AIRTABLE_API_KEY');
    const baseId = this.configService.get<string>('AIRTABLE_BASE_ID');

    if (!apiKey || !baseId) {
      this.logger.error(
        'AIRTABLE_API_KEY ou AIRTABLE_BASE_ID não configurados no .env',
      );
      return;
    }

    Airtable.configure({ apiKey });
    this.base = Airtable.base(baseId);
    this.logger.log('Conexão com Airtable inicializada com sucesso.');
  }

  async findContactByEmail(email: string): Promise<any | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const cacheKey = `contact:${normalizedEmail}`;

    return this.cache.getOrSet(cacheKey, () =>
      this.rateLimiter.execute(() =>
        withRetry(
          async () => {
            const records = await this.base('Contatos')
              .select({
                filterByFormula: `LOWER({E-mail}) = "${normalizedEmail}"`,
                maxRecords: 1,
              })
              .firstPage();

            if (!records || records.length === 0) {
              return null;
            }

            const record = records[0];
            const fields = record.fields || {};
            const rawRole =
              fields['role'] ||
              fields['Role'] ||
              fields['Perfil'] ||
              fields['Tipo de acesso'] ||
              fields['Tipo de usuário'] ||
              fields['Cargo'];

            const normalizedRole = String(rawRole || '')
              .trim()
              .toLowerCase();

            const role =
              normalizedRole.includes('admin') ||
              normalizedRole.includes('administrador') ||
              normalizedRole.includes('administrativo')
                ? 'admin'
                : 'client';

            return {
              id: record.id,
              email: record.get('E-mail'),
              nomeCompleto: record.get('Nome completo'),
              role,
              companyId: Array.isArray(fields['Empresa']) ? fields['Empresa'][0] : null,
            };
          },
          `findContactByEmail(${normalizedEmail})`,
        ),
      ),
    );
  }

  async getRecords(tableName: string, options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = this.buildRecordsCacheKey(tableName, options);

    return this.cache.getOrSet(cacheKey, () =>
      this.rateLimiter.execute(() =>
        withRetry(
          async () => {
            const selectOptions: any = {};

            if (options.filterByFormula) selectOptions.filterByFormula = options.filterByFormula;
            if (options.fields?.length) selectOptions.fields = options.fields;
            if (options.maxRecords) selectOptions.maxRecords = options.maxRecords;
            if (options.sort) selectOptions.sort = options.sort;

            const records = await this.base(tableName).select(selectOptions).all();

            return records.map((record: any) => ({
              id: record.id,
              ...record.fields,
            }));
          },
          `getRecords(${tableName})`,
        ),
      ),
    );
  }

  async getRecordById(tableName: string, recordId: string): Promise<any> {
    const cacheKey = `record:${tableName}:${recordId}`;

    return this.cache.getOrSet(cacheKey, () =>
      this.rateLimiter.execute(() =>
        withRetry(
          async () => {
            const record = await this.base(tableName).find(recordId);
            return {
              id: record.id,
              ...record.fields,
            };
          },
          `getRecordById(${tableName}, ${recordId})`,
        ),
      ),
    );
  }

  buildLinkedRecordFilter(fieldName: string, names: string[]): string {
    if (!names || names.length === 0) return 'FALSE()';

    const conditions = names.map(
      (name) => `SEARCH("${this.escapeString(name)}", ARRAYJOIN({${fieldName}}))`,
    );

    return conditions.length === 1
      ? conditions[0]
      : `OR(${conditions.join(', ')})`;
  }

  /* Permite invalidar o cache manualmente (útil para futuras integrações
     de webhook do Airtable em caso de alteração externa). */
  invalidateCache(prefix?: string): void {
    if (prefix) {
      this.cache.invalidatePrefix(prefix);
    } else {
      this.cache.clear();
    }
  }

  /* Constrói uma chave de cache determinística para getRecords. */
  private buildRecordsCacheKey(tableName: string, options: QueryOptions): string {
    const parts = [`records:${tableName}`];
    if (options.filterByFormula) parts.push(`f=${options.filterByFormula}`);
    if (options.fields?.length) parts.push(`fields=${options.fields.sort().join(',')}`);
    if (options.maxRecords) parts.push(`max=${options.maxRecords}`);
    if (options.sort) parts.push(`sort=${JSON.stringify(options.sort)}`);
    return parts.join('|');
  }

  private escapeString(str: string): string {
    return str.replace(/"/g, '\\"');
  }
}