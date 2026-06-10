import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { CompanyService } from '../company/company.service';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(
    private readonly airtableService: AirtableService,
    private readonly companyService: CompanyService,
  ) {}

  async findAllByUserEmail(email: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      /* Filtro direto no Airtable - traz apenas orçamentos da empresa */
      const formula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );

      const budgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: formula,
      });

      return budgets.map((budget) => this.mapBudget(budget));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao listar orçamentos: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar orçamentos.');
    }
  }

  async findOneByUserEmail(email: string, budgetId: string) {
    try {
      const { companyId } = await this.companyService.getCompanyContext(email);
      const budget = await this.airtableService.getRecordById('Orçamentos', budgetId);

      /* Validação de ownership */
      const empresaIds = budget['Empresa'];
      if (!Array.isArray(empresaIds) || !empresaIds.includes(companyId)) {
        throw new NotFoundException(
          'Orçamento não encontrado ou não pertence à sua empresa.',
        );
      }

      return this.mapBudget(budget);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao buscar orçamento: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar orçamento.');
    }
  }

  private mapBudget(budget: any) {
    return {
      id: budget.id,

      /* Nome da obra = campo "Orçamentos" */
      name: this.cleanText(budget['Orçamentos']) || 'Informação em atualização',

      /* Produto: prefere o lookup dos Projetos; cai para o campo Produto simples */
      product:
        this.normalizeArrayOrString(budget['Produto (from Projetos)']) ||
        this.normalizeArrayOrString(budget['Produto']) ||
        'Informação em atualização',

      /* Valor com cascata de fallback (os campos vêm zerados em alguns casos):
         1) Valor Total do Orçamento (Projetos)
         2) Valor total das entregas (from Projetos)
         3) Valor instalação                                                   */
      value: this.firstPositiveNumber([
        budget['Valor Total do Orçamento (Projetos)'],
        budget['Valor total das entregas (from Projetos)'],
        budget['Valor instalação'],
      ]),

      budgetType: this.normalizeArrayOrString(budget['Tipo de orçamento']),

      /* Etapa do negócio = a etapa que a Lorena pediu (ex: "Concluído") */
      stage: budget['Etapa do negócio'] || 'Informação em atualização',

      /* Etapa do projeto (campo separado, útil no kanban de projetos) */
      projectStage: budget['Etapa do projeto'] || null,

      closingDate: budget['Data de fechamento'] || null,
      creationDate: budget['Data de criação'] || null,
      city: budget['Cidade da obra'] || null,
      deliveryAddress: this.cleanText(budget['Endereço de entrega']) || null,

      salesChannel: budget['Canal de vendas'] || null,
      totalQuantity: budget['Quantidade'] ?? null,

      /* Relacionamentos */
      linkedProjects: budget['Projetos'] || [],
      linkedDeliveries: budget['Entregas'] || [],

      /* Anexos do próprio orçamento (para a página de detalhe da obra) */
      attachments: this.extractBudgetAttachments(budget),
    };
  }

  /* Reúne todos os anexos que ficam direto na tabela Orçamentos. */
  private extractBudgetAttachments(budget: any) {
    const attachmentFields = [
      { field: 'Nota Fiscal (anexo)', category: 'Nota Fiscal' },
      { field: 'Proposta comercial (anexo)', category: 'Proposta Comercial' },
      { field: 'Pedido de Compra (anexo)', category: 'Pedido de Compra' },
      { field: 'Contrato (anexo)', category: 'Contrato' },
      { field: 'Contrato instalação (anexo)', category: 'Contrato de Instalação' },
      { field: 'CNPJ & CNO (anexo)', category: 'CNPJ e CNO' },
      { field: 'Enviado pelo cliente', category: 'Enviado pelo Cliente' },
    ];

    const result: any[] = [];
    attachmentFields.forEach(({ field, category }) => {
      const value = budget[field];
      if (Array.isArray(value)) {
        value.forEach((att: any) => {
          if (att && att.url) {
            result.push({
              id: att.id,
              filename: att.filename || 'arquivo-sem-nome',
              url: att.url,
              size: att.size || null,
              type: att.type || null,
              category,
            });
          }
        });
      }
    });
    return result;
  }

  /* Retorna o primeiro número > 0 de uma lista de candidatos (ou null). */
  private firstPositiveNumber(candidates: any[]): number | null {
    for (const c of candidates) {
      const n = Number(c);
      if (!isNaN(n) && n > 0) return n;
    }
    return null;
  }

  private cleanText(value: any): string | null {
    if (typeof value === 'string') return value.trim();
    return this.normalizeArrayOrString(value);
  }

  private normalizeArrayOrString(value: any): string | null {
    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : null;
    }
    return value || null;
  }
}