import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /* GET /company
     Retorna os dados da empresa + contato do usuário autenticado. */
  @Get()
  async getCompany(@CurrentUser() user: { email: string }) {
    return this.companyService.findCompanyByUserEmail(user.email);
  }
}