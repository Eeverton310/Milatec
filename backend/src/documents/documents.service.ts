import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { CompanyService } from '../company/company.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  /* Mapeamento centralizado dos campos de anexo por tabela.
     Conforme orientação da MilaTec: documentos vêm de Orçamentos e Entregas.
     A tabela "Instalações" NÃO deve aparecer no sistema do cliente.       */
  private readonly attachmentFields = {
    Orçamentos: [
      { field: 'Nota Fiscal (anexo)', category: 'Nota Fiscal' },
      { field: 'Proposta comercial (anexo)', category: 'Proposta Comercial' },
      { field: 'Pedido de Compra (anexo)', category: 'Pedido de Compra' },
      { field: 'Contrato (anexo)', category: 'Contrato' },
      { field: 'Contrato instalação (anexo)', category: 'Contrato de Instalação' },
      { field: 'CNPJ & CNO (anexo)', category: 'CNPJ e CNO' },
      { field: 'Enviado pelo cliente', category: 'Enviado pelo Cliente' },
    ],
    Entregas: [
      { field: 'Romaneio de entrega (anexo)', category: 'Romaneio de Entrega' },
      {
        field: 'Contrato (anexo) (from Orçamentos)',
        category: 'Contrato',
      },
      {
        field: 'CNPJ & CNO (anexo) (from Orçamentos)',
        category: 'CNPJ e CNO',
      },
    ],
  };

  constructor(
    private readonly airtableService: AirtableService,
    private readonly companyService: CompanyService,
  ) {}

  async findAllByUserEmail(email: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      /* 1. Busca os orçamentos da empresa (com fórmula nativa do Airtable) */
      const budgetFormula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );

      const companyBudgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: budgetFormula,
      });

      if (companyBudgets.length === 0) {
        return { total: 0, documents: [] };
      }

      /* 2. Extrai IDs de entregas vinculadas aos orçamentos */
      const deliveryIds = [
        ...new Set(
          companyBudgets.flatMap((b) =>
            Array.isArray(b['Entregas']) ? b['Entregas'] : [],
          ),
        ),
      ];

      /* 3. Busca as entregas pelos IDs (em paralelo) */
      const companyDeliveries =
        deliveryIds.length > 0
          ? await Promise.all(
              deliveryIds.map((id) =>
                this.airtableService.getRecordById('Entregas', id),
              ),
            )
          : [];

      /* 4. Extrai documentos APENAS de Orçamentos e Entregas
            (Instalações foi removido conforme pedido da MilaTec).
            Cada documento carrega o orçamento de origem para vínculo. */
      const allDocuments = [
        ...this.extractDocuments(companyBudgets, 'Orçamentos'),
        ...this.extractDocuments(companyDeliveries, 'Entregas'),
      ];

      /* Remove duplicados pela URL (o mesmo anexo pode vir de lookup) */
      const uniqueDocuments = this.dedupeByUrl(allDocuments);

      return {
        total: uniqueDocuments.length,
        documents: uniqueDocuments,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao listar documentos: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar documentos.');
    }
  }

  /* Extrai anexos de registros usando o mapeamento centralizado.
     Vincula cada documento ao orçamento de origem (budgetName/budgetId). */
  private extractDocuments(records: any[], tableName: string) {
    const fields = this.attachmentFields[tableName] || [];
    const documents: any[] = [];

    records.forEach((record) => {
      /* Nome/ID do orçamento de origem, para mostrar "obra vinculada" */
      const budgetName =
        tableName === 'Orçamentos'
          ? record['Orçamentos'] || null
          : this.normalizeArrayOrString(
              record['Orçamentos (from Orçamentos)'] || record['Entregas'],
            ) || null;

      const budgetId =
        tableName === 'Orçamentos'
          ? record.id
          : Array.isArray(record['Orçamentos'])
            ? record['Orçamentos'][0]
            : null;

      fields.forEach(({ field, category }) => {
        const attachments = record[field];
        if (Array.isArray(attachments) && attachments.length > 0) {
          attachments.forEach((att: any) => {
            if (att && att.url) {
              documents.push({
                id: att.id,
                filename: att.filename || 'arquivo-sem-nome',
                url: att.url,
                size: att.size || null,
                type: att.type || null,
                category,
                source: tableName,
                recordId: record.id,
                budgetId,
                budgetName,
              });
            }
          });
        }
      });
    });

    return documents;
  }

  private dedupeByUrl(documents: any[]) {
    const seen = new Set<string>();
    return documents.filter((doc) => {
      if (!doc.url) return true;
      if (seen.has(doc.url)) return false;
      seen.add(doc.url);
      return true;
    });
  }

  private normalizeArrayOrString(value: any): string | null {
    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : null;
    }
    return value || null;
  }
}