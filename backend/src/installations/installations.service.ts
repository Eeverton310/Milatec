import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { CompanyService } from '../company/company.service';

@Injectable()
export class InstallationsService {
  private readonly logger = new Logger(InstallationsService.name);

  constructor(
    private readonly airtableService: AirtableService,
    private readonly companyService: CompanyService,
  ) {}

  async findAllByUserEmail(email: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      // 1. Pega os IDs dos orçamentos da empresa
      const budgetFormula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );

      const companyBudgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: budgetFormula,
        fields: ['Empresa'],
      });
      const companyBudgetIds = companyBudgets.map((b) => b.id);

      if (companyBudgetIds.length === 0) return [];

      // 2. Busca todas as instalações e filtra pelos IDs de orçamento
      // (filterByFormula via SEARCH não funciona em linked records porque
      // ARRAYJOIN retorna nomes, não IDs)
      const allInstallations = await this.airtableService.getRecords('Instalações');

      const companyInstallations = allInstallations.filter((installation) => {
        const budgetIds = installation['Orçamentos'];
        return (
          Array.isArray(budgetIds) &&
          budgetIds.some((id) => companyBudgetIds.includes(id))
        );
      });

      return companyInstallations.map((inst) => this.mapInstallation(inst));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao listar instalações: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar instalações.');
    }
  }

  async findOneByUserEmail(email: string, installationId: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      const installation = await this.airtableService.getRecordById(
        'Instalações',
        installationId,
      );

      // Validação de ownership
      const installBudgetIds = installation['Orçamentos'] || [];

      const budgetFormula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );
      const companyBudgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: budgetFormula,
        fields: ['Empresa'],
      });
      const companyBudgetIds = companyBudgets.map((b) => b.id);

      const belongsToCompany = installBudgetIds.some((id) =>
        companyBudgetIds.includes(id),
      );

      if (!belongsToCompany) {
        throw new NotFoundException(
          'Instalação não encontrada ou não pertence à sua empresa.',
        );
      }

      return this.mapInstallation(installation);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao buscar instalação: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar instalação.');
    }
  }

  private mapInstallation(installation: any) {
    return {
      id: installation.id,
      name: installation['Instalação ID'] || installation['Tipo de serviço'] || 'Obra',
      serviceType: installation['Tipo de serviço'] || 'Informação em atualização',
      stage: this.normalizeArrayOrString(installation['Etapa do negócio (from Orçamentos)']) || 'Informação em atualização',
      startDate: installation['Data de início'] || null,
      endDate: installation['Data de fim'] || null,
      creationDate: installation['Data de criação'] || null,
      deliveryAddress: this.normalizeArrayOrString(installation['Endereço de entrega (from Orçamentos)']),
      city: this.normalizeArrayOrString(installation['Cidade da obra (from Orçamentos)']),
      assemblyDetails: installation['Detalhes da montagem'] || null,
      programmedDays: installation['Nº dias programados'] || null,
      installationId: installation['Instalação ID'] || null,
      businessStage: this.normalizeArrayOrString(
        installation['Etapa do negócio (from Orçamentos)']),
      budgetType: this.normalizeArrayOrString(
        installation['Tipo de orçamento (from Orçamentos)']),
      linkedBudgets: installation['Orçamentos'] || [],
      linkedTeam: installation['Equipe de instalação'] || [],
    };
  }

  private normalizeArrayOrString(value: any): string | null {
    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : null;
    }
    return value || null;
  }
}