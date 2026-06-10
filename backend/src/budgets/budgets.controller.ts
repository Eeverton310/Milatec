import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  /* GET /budgets
    Lista todos os orçamentos da empresa do usuário autenticado. */
  @Get()
  async findAll(@CurrentUser() user: { email: string }) {
    return this.budgetsService.findAllByUserEmail(user.email);
  }

  /* GET /budgets/:id
     Retorna detalhes de um orçamento específico. */
  @Get(':id')
  async findOne(
    @CurrentUser() user: { email: string },
    @Param('id') id: string,
  ) {
    return this.budgetsService.findOneByUserEmail(user.email, id);
  }
}