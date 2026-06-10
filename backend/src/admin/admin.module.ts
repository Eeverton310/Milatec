import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AirtableModule } from '../airtable/airtable.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AirtableModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
