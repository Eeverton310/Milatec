import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AirtableModule } from './airtable/airtable.module';
import { CompanyModule } from './company/company.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ProjectsModule } from './projects/projects.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { InstallationsModule } from './installations/installations.module';
import { DocumentsModule } from './documents/documents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AirtableModule,
    AuthModule,
    CompanyModule,
    BudgetsModule,
    ProjectsModule,
    DeliveriesModule,
    InstallationsModule,
    DocumentsModule,
    DashboardModule,
    AdminModule,
  ],
})
export class AppModule {}