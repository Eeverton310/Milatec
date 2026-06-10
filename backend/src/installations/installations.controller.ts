import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InstallationsService } from './installations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('installations')
@UseGuards(JwtAuthGuard)
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @Get()
  async findAll(@CurrentUser() user: { email: string }) {
    return this.installationsService.findAllByUserEmail(user.email);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { email: string },
    @Param('id') id: string,
  ) {
    return this.installationsService.findOneByUserEmail(user.email, id);
  }
}