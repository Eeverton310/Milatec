import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { CompanyService } from '../company/company.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly airtableService: AirtableService,
    private readonly companyService: CompanyService,
  ) {}

  async findAllByUserEmail(email: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      // Busca orçamentos da empresa, já trazendo o campo Projetos vinculados
      const formula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );

      const budgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: formula,
        fields: ['Projetos'],
      });

      // Extrai todos os IDs de projetos vinculados a esses orçamentos.
      // Set elimina duplicatas caso um projeto esteja em mais de um orçamento.
      const projectIds = [
        ...new Set(
          budgets.flatMap((b) => (Array.isArray(b['Projetos']) ? b['Projetos'] : [])),
        ),
      ];

      if (projectIds.length === 0) return [];

      // Busca cada projeto pelo ID em paralelo (cache absorve repetições)
      const projects = await Promise.all(
        projectIds.map((id) => this.airtableService.getRecordById('Projetos', id)),
      );

      return projects.map((project) => this.mapProject(project));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao listar projetos: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar projetos.');
    }
  }

  async findOneByUserEmail(email: string, projectId: string) {
    try {
      const { companyName } = await this.companyService.getCompanyContext(email);

      // Busca o projeto solicitado
      const project = await this.airtableService.getRecordById('Projetos', projectId);

      // Valida ownership: o projeto precisa estar vinculado a algum orçamento da empresa
      const projectBudgetIds = project['Orçamentos'] || [];

      const formula = this.airtableService.buildLinkedRecordFilter(
        'Empresa',
        [companyName],
      );
      const companyBudgets = await this.airtableService.getRecords('Orçamentos', {
        filterByFormula: formula,
        fields: ['Empresa'],
      });
      const companyBudgetIds = companyBudgets.map((b) => b.id);

      const belongsToCompany = projectBudgetIds.some((id: string) =>
        companyBudgetIds.includes(id),
      );

      if (!belongsToCompany) {
        throw new NotFoundException(
          'Projeto não encontrado ou não pertence à sua empresa.',
        );
      }

      return this.mapProject(project);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao buscar projeto: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar projeto.');
    }
  }

  private mapProject(project: any) {
    return {
      id: project.id,
      name: project['Projeto'] || 'Informação em atualização',
      stage: project['Etapa do Projeto'] || 'Informação em atualização',
      projectId: project['Projeto ID'] || null,
      budgetType: this.normalizeArrayOrString(project['Tipo de orçamento']),
      businessStage: this.normalizeArrayOrString(project['Etapa do negócio']), //vem do orçamento
      city: this.normalizeArrayOrString(project['Cidade da obra']),
      weight: project['Peso do projeto (kg)'] || 0,
      totalWeight: project['Peso Total'] || 0,
      quantity: project['Quantidade'] ?? null,
      largestPart: project['Maior peça'] || null,
      totalValue: project['Valor total (Projeto)'] || 0,
      // Valor da unidade (nome real: "Valor da unidade (Orçamento)")
      unitValue:
        project['Valor da unidade (Orçamento)'] ??
        project['Valor da unidade'] ??
        null,
      // Anexos da documentação do projeto (nomes reais do Airtable)
      preProjectAttachment: this.firstAttachment(project['Pré-Projeto']),
      approvalAttachment: this.firstAttachment(project['Projeto para aprovação']),
      executiveAttachment: this.firstAttachment(project['Projeto executivo']),
      registrationAttachment: this.firstAttachment(project['Registro de Obra']),
      linkedBudgets: project['Orçamentos'] || [],
      linkedDeliveries: project['Entregas'] || [],
    };
  }

  /* Retorna o primeiro anexo de um campo (ou null), normalizado. */
  private firstAttachment(value: any) {
    if (!Array.isArray(value) || value.length === 0) return null;
    const att = value[0];
    if (!att || !att.url) return null;
    return {
      id: att.id,
      filename: att.filename || 'arquivo-sem-nome',
      url: att.url,
      size: att.size || null,
      type: att.type || null,
    };
  }
  
  private normalizeArrayOrString(value: any): string | null {
    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : null;
    }
    return value || null;
  }
}