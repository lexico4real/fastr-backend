import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationsService } from './application.service';
import { ApplyDto } from './dto/apply.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { AllPrivileges } from 'common/enums/privileges';

@UseGuards(AuthGuard(), PrivilegesGuard)
@ApiBearerAuth('token')
@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('apply')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_APPLY_FOR_JOB)
  async apply(@Req() req: Request, @Body() applyDto: ApplyDto) {
    const user = req.user;
    return await this.applicationsService.apply(user, applyDto);
  }

  @Get('mine')
  @ApiBearerAuth('token')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async getMyApplications(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req: Request,
  ) {
    return await this.applicationsService.getMyApplications(
      page,
      perPage,
      req,
    );
  }

  @Get('received')
  // @Privileges(AllPrivileges.CAN_VIEW_RECEIVED_APPLICATIONS)
  @ApiBearerAuth('token')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async getReceivedApplications(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req?: Request,
  ) {
    return await this.applicationsService.getReceivedApplications(
      page,
      perPage,
      req,
    );
  }

  @Get(':applicationId/applied')
  @Privileges(AllPrivileges.CAN_VIEW_ANY_APPLICATION)
  @ApiBearerAuth('token')
  async getApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return await this.applicationsService.getApplication(applicationId);
  }

  @Patch(':applicationId/status')
  @Privileges(AllPrivileges.CAN_UPDATE_APPLICATION_STATUS)
  async updateStatus(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
  ) {
    return await this.applicationsService.updateStatus(
      applicationId,
      updateApplicationStatusDto,
    );
  }
}
