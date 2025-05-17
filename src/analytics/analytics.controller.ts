import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { PrivilegesConstant } from 'common/enums/privileges';
import { Privileges } from 'src/auth/decorators/privileges.decorator';

@Controller('analytics')
@ApiTags('analytics')
@ApiBearerAuth('token')
@UseGuards(AuthGuard(), PrivilegesGuard)
@Privileges(PrivilegesConstant.CAN_VIEW_ANALYTICS)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('student/summary')
  getStudentSummary() {
    return this.analyticsService.getStudentSummary();
  }

  @Get('business/summary')
  getBusinessSummary() {
    return this.analyticsService.getBusinessSummary();
  }

  @Get('admin/summary')
  getAdminSummary() {
    return this.analyticsService.getAdminSummary();
  }
}
