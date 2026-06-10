import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async findAll(@CurrentUser() user: { email: string }) {
    return this.deliveriesService.findAllByUserEmail(user.email);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { email: string },
    @Param('id') id: string,
  ) {
    return this.deliveriesService.findOneByUserEmail(user.email, id);
  }
}