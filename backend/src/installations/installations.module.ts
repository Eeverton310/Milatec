import { Module } from '@nestjs/common';
import { InstallationsController } from './installations.controller';
import { InstallationsService } from './installations.service';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [AuthModule, CompanyModule],
  controllers: [InstallationsController],
  providers: [InstallationsService],
  exports: [InstallationsService],
})
export class InstallationsModule {}