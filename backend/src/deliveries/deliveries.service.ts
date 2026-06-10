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
      name: delivery['Etapa de entrega'] || 'Informação em atualização',
      stage: delivery['Etapa de entrega'] || 'Informação em atualização',
      value: delivery['Valor'] || null,
      city: delivery['Cidade da obra'] || null,
      deliveryDate: delivery['Data de entrega'] || null,
      quantity: delivery['Quantidade'] || null,
      transport: delivery['Transporte'] || null,
      realizedValue: delivery['Valor entrega realizada'] || null,
      shippingNote: delivery['Romaneio de entrega'] || null,
      linkedBudgets: delivery['Orçamentos'] || [],
    };
  }
}