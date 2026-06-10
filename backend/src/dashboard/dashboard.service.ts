import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CompanyService } from '../company/company.service';
import { BudgetsService } from '../budgets/budgets.service';
import { ProjectsService } from '../projects/projects.service';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly companyService: CompanyService,
    private readonly budgetsService: BudgetsService,
    private readonly projectsService: ProjectsService,
    private readonly deliveriesService: DeliveriesService,
    private readonly documentsService: DocumentsService,
  ) {}

  /* Agrega todos os dados do dashboard em uma única resposta.
     Todas as buscas rodam em paralelo via Promise.all.
     NOTA: Instalações foi removido — "Obras" agora = Orçamentos.       */
  async getDashboard(email: string) {
    try {
      const companyData = await this.companyService.findCompanyByUserEmail(email);

      const [budgets, projects, deliveries, documents] = await Promise.all([
        this.budgetsService.findAllByUserEmail(email),
        this.projectsService.findAllByUserEmail(email),
        this.deliveriesService.findAllByUserEmail(email),
        this.documentsService.findAllByUserEmail(email),
      ]);

      return {
        company: companyData.company,
        contact: companyData.contact,
        summary: this.buildSummary(budgets, projects, deliveries),
        budgets,
        projects,
        deliveries,
        /* "obras" agora é um alias dos orçamentos, para o frontend que
           ainda referencia "obras" continuar funcionando sem quebrar. */
        obras: budgets,
        documents: documents.documents,
        documentsCount: documents.total,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erro ao montar dashboard: ${error.message}`);
      throw new InternalServerErrorException('Erro ao carregar dashboard.');
    }
  }

  /* Calcula métricas resumidas para os cards do dashboard. */
  private buildSummary(budgets: any[], projects: any[], deliveries: any[]) {
    /* Card "Valor acompanhado": soma o valor dos orçamentos (já vem com
       fallback tratado no budgets.service, então não fica mais R$ 0,00). */
    const totalBudgetValue = budgets.reduce(
      (sum, b) => sum + (Number(b.value) || 0),
      0,
    );

    /* Card "Orçamentos ativos": orçamentos que não estão em etapa final. */
    const activeBudgets = budgets.filter(
      (b) => b.stage && !this.isFinalStage(b.stage),
    ).length;

    /* Card "Entregas programadas": entregas que ainda têm data futura
       ou que não foram marcadas como realizadas. */
    const scheduledDeliveries = deliveries.filter(
      (d) => d.stage && !this.isDeliveryDone(d.stage),
    ).length;

    const projectsInProgress = projects.filter(
      (p) => p.stage && !this.isFinalStage(p.stage),
    ).length;

    return {
      totals: {
        /* "Obras" = total de orçamentos (Obras = Orçamentos) */
        obras: budgets.length,
        budgets: budgets.length,
        projects: projects.length,
        deliveries: deliveries.length,
      },
      financial: {
        totalBudgetValue,
      },
      progress: {
        activeBudgets,
        scheduledDeliveries,
        projectsInProgress,
      },
    };
  }

  /* Identifica se uma etapa de negócio representa fase final/encerrada. */
  private isFinalStage(stage: string): boolean {
    const finalStages = [
      'Concluído',
      'Finalizado',
      'Entregue',
      'Cancelado',
      'Negócio perdido',
      'Perdido',
    ];
    return finalStages.some((s) =>
      stage.toLowerCase().includes(s.toLowerCase()),
    );
  }

  /* Identifica se uma entrega já foi realizada. */
  private isDeliveryDone(stage: string): boolean {
    const doneStages = ['Entrega realizada', 'Realizada', 'Entregue'];
    return doneStages.some((s) =>
      stage.toLowerCase().includes(s.toLowerCase()),
    );
  }
}