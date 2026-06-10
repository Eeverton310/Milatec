import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@CurrentUser() user: { email: string }) {
    return this.projectsService.findAllByUserEmail(user.email);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { email: string },
    @Param('id') id: string,
  ) {
    return this.projectsService.findOneByUserEmail(user.email, id);
  }
}