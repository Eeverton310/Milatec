import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('projects')
  async projects() {
    return this.adminService.getAllProjects();
  }

  @Get('companies')
  async companies() {
    return this.adminService.getAllCompanies();
  }

  @Get('users')
  async users() {
    return this.adminService.getAllUsers();
  }
}
