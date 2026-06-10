import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { ProjectsModule } from '../projects/projects.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    AuthModule,
    CompanyModule,
    BudgetsModule,
    ProjectsModule,
    DeliveriesModule,
    DocumentsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}