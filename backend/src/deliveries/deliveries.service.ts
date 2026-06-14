import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { CompanyService } from '../company/company.service';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    private readonly airtableService: AirtableService,
    private readonly companyService: CompanyService,
  ) {}

  async findAllByUserEmail(email: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      // Busca orçamentos da empresa, trazendo o campo Entregas vinculadas
      const formula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );

      const budgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: formula,
        fields: ['Entregas'],
      });

      // Extrai todos os IDs de entregas vinculadas, sem duplicatas
      const deliveryIds = [
        ...new Set(
          budgets.flatMap((b) =>
            Array.isArray(b['Entregas']) ? b['Entregas'] : [],
          ),
        ),
      ];

      if (deliveryIds.length === 0) return [];

      // Busca cada entrega pelo ID em paralelo
      const deliveries = await Promise.all(
        deliveryIds.map((id) =>
          this.airtableService.getRecordById('Entregas', id),
        ),
      );

      return deliveries.map((delivery) => this.mapDelivery(delivery));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao listar entregas: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar entregas.');
    }
  }

  async findOneByUserEmail(email: string, deliveryId: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      const delivery = await this.airtableService.getRecordById(
        'Entregas',
        deliveryId,
      );

      // Validação de ownership
      const deliveryBudgetIds = delivery['Orçamentos'] || [];

      const formula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );
      const companyBudgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: formula,
        fields: ['Empresa'],
      });
      const companyBudgetIds = companyBudgets.map((b) => b.id);

      const belongsToCompany = deliveryBudgetIds.some((id) =>
        companyBudgetIds.includes(id),
      );

      if (!belongsToCompany) {
        throw new NotFoundException(
          'Entrega não encontrada ou não pertence à sua empresa.',
        );
      }

      return this.mapDelivery(delivery);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao buscar entrega: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar entrega.');
    }
  }

  private mapDelivery(delivery: any) {
    return {
      id: delivery.id,
      // Nome da entrega = campo "Entregas" (ex: "RL - JARDINS - 9ª ENTREGA")
      name: this.normalizeArrayOrString(delivery['Entregas']) ||
        'Informação em atualização',
      // Etapa real = "Etapa da entrega" (e não "Etapa de entrega")
      stage: delivery['Etapa da entrega'] || 'Informação em atualização',
      // Valor real = "Valor Entrega Realizada"
      value: delivery['Valor'] ?? null,
      // Cidade: usa a da obra; cai para o lookup vindo de Orçamentos
      city:
        delivery['Cidade da obra'] ||
        this.normalizeArrayOrString(delivery['Cidade da obra (from Orçamentos)']) ||
        null,
      deliveryDate: delivery['Data de entrega'] || null,
      quantity: delivery['Quantidade'] ?? null,
      weight: delivery['Peso do pedido (kg)'] ?? null,
      largestPart: delivery['Maior peça (mm)'] ?? null,
      transport: delivery['Transporte'] || null,
      deliveryAddress:
        this.cleanText(delivery['Endereço de entrega']) ||
        this.cleanText(delivery['Endereço de entrega (from Orçamentos)']) ||
        null,
      linkedBudgets: delivery['Orçamentos'] || [],
    };
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