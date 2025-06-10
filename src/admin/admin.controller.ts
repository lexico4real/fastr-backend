import {
  Controller,
  Get,
  Param,
  Put,
  NotFoundException,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { AllPrivileges } from 'common/enums/privileges';

@Controller('admin')
@ApiTags('admin')
@ApiBearerAuth('token')
@UseGuards(AuthGuard(), PrivilegesGuard)
@Privileges(AllPrivileges.CAN_VIEW_ADMIN_DASHBOARD)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('jobs')
  async getJobs() {
    return this.adminService.getAllJobs();
  }

  @Get('transactions')
  async getTransactions() {
    return this.adminService.getAllTransactions();
  }

  @Put('verify-student/:id')
  async verifyStudent(@Param('id', ParseUUIDPipe) id: string) {
    const updated = await this.adminService.verifyStudent(id);
    if (!updated) {
      throw new NotFoundException('Student not found');
    }
    return { message: 'Student verified successfully' };
  }

  @Put('verify-business/:id')
  async verifyBusiness(@Param('id', ParseUUIDPipe) id: string) {
    const updated = await this.adminService.verifyBusiness(id);
    if (!updated) {
      throw new NotFoundException('Business not found');
    }
    return { message: 'Business verified successfully' };
  }
}
