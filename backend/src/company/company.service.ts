import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(private readonly airtableService: AirtableService) {}

  /* Busca a empresa vinculada ao e-mail autenticado.
     Fluxo: Contatos -> Empresa (linked record) -> dados completos. */
  async findCompanyByUserEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      /* Filtro nativo do Airtable: já retorna apenas o contato do e-mail informado */
      const contacts = await this.airtableService.getRecords('Contatos', {
        filterByFormula: `LOWER({E-mail}) = "${normalizedEmail}"`,
        maxRecords: 1,
      });

      if (!contacts || contacts.length === 0) {
        throw new NotFoundException('Contato não encontrado na base MilaTec.');
      }

      const userContact = contacts[0];
      const empresaIds = userContact['Empresa'];

      if (!empresaIds || empresaIds.length === 0) {
        throw new NotFoundException('Este contato não possui empresa vinculada.');
      }

      const empresa = await this.airtableService.getRecordById(
        'Empresas',
        empresaIds[0],
      );

      return {
        company: {
          id: empresa.id,
          name: empresa['Empresa'] || 'Empresa não informada',
          cnpj: empresa['CNPJ'] || null,
          state: empresa['Estado'] || null,
          lifecycleStage: empresa['Fase do ciclo de vida'] || null,
        },
        contact: {
          id: userContact.id,
          name: userContact['Nome completo'] || null,
          email: userContact['E-mail'] || null,
          role: userContact['Cargo'] || null,
          phone: userContact['Número de telefone'] || null,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao buscar empresa: ${error.message}`);
      throw new InternalServerErrorException(
        'Erro ao buscar dados da empresa. Tente novamente.',
      );
    }
  }

  /* Helper compartilhado: retorna os IDs e nome da empresa do usuário.
     Usado pelos demais módulos para filtrar registros vinculados. */
  async getCompanyContext(email: string) {
    const { company } = await this.findCompanyByUserEmail(email);
    return {
      companyId: company.id,
      companyName: company.name,
    };
  }

  /* Helper compartilhado: retorna os IDs dos orçamentos da empresa do usuário.
     Centraliza a lógica usada em projects, deliveries, installations e documents. */
  async getCompanyBudgetIds(email: string): Promise<{
    companyId: string;
    companyName: string;
    budgetIds: string[];
  }> {
    const { companyId, companyName } = await this.getCompanyContext(email);

    /* Filtro nativo: traz apenas os orçamentos da empresa, não a base inteira */
    const formula = this.airtableService.buildLinkedRecordFilter(
      'Empresa',
      [companyName],
    );

    const budgets = await this.airtableService.getRecords('Orçamentos', {
      filterByFormula: formula,
      fields: ['Empresa'], /* só precisamos dos IDs */
    });

    return {
      companyId,
      companyName,
      budgetIds: budgets.map((b) => b.id),
    };
  }
}