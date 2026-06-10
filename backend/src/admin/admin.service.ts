import { Injectable } from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';

@Injectable()
export class AdminService {
  constructor(private readonly airtableService: AirtableService) {}

  async getAllProjects() {
    return this.airtableService.getRecords('Projetos');
  }

  async getAllCompanies() {
    return this.airtableService.getRecords('Empresas');
  }

  async getAllUsers() {
    return this.airtableService.getRecords('Contatos');
  }

  async getAllBudgets() {
    return this.airtableService.getRecords('Orçamentos');
  }

  async getAllDeliveries() {
    return this.airtableService.getRecords('Entregas');
  }

  async getAllInstallations() {
    return this.airtableService.getRecords('Instalações');
  }

  async getDashboard() {
    const [projects, companies, users, budgets, deliveries, installations] = await Promise.all([
      this.getAllProjects(),
      this.getAllCompanies(),
      this.getAllUsers(),
      this.getAllBudgets(),
      this.getAllDeliveries(),
      this.getAllInstallations(),
    ]);

    return {
      totalProjects: projects.length,
      totalCompanies: companies.length,
      totalUsers: users.length,
      totalBudgets: budgets.length,
      totalDeliveries: deliveries.length,
      totalInstallations: installations.length,
      projects,
      companies,
      users,
      budgets,
      deliveries,
      installations,
    };
  }
}
