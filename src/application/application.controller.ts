import { Controller, Post, Get, Body, Param, Req, UseGuards, Query, Patch } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationsService } from './application.service';
import { ApplyDto } from './dto/apply.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { PrivilegesConstant } from 'common/enums/privileges';

@UseGuards(AuthGuard())
@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Post('apply')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_APPLY_FOR_JOB)
  async apply(@Req() req: Request, @Body() applyDto: ApplyDto) {
    const userId = req.user['id'];
    return await this.applicationsService.apply(userId, applyDto);
  }

  @Get('my-applications')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async getMyApplications(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req: Request,
  ) {
    const userId = req.user['id'];
    return await this.applicationsService.getMyApplications(userId, page, perPage, req);
  }

  @Get('received')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_VIEW_RECEIVED_APPLICATIONS)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async getReceivedApplications(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req?: Request,
  ) {
    const userId = req.user['id'];
    return await this.applicationsService.getReceivedApplications(userId, page, perPage, req);
  }

  @Get(':applicationId/applied')
  async getApplication(@Param('applicationId') applicationId: string) {
    return await this.applicationsService.getApplication(applicationId);
  }

  @Patch(':applicationId/update-status')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_UPDATE_APPLICATION_STATUS)
  async updateStatus(
    @Param('applicationId') applicationId: string,
    @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
  ) {
    return await this.applicationsService.updateStatus(applicationId, updateApplicationStatusDto);
  }
}