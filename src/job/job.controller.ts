import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { AuthGuard } from '@nestjs/passport';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { PrivilegesConstant } from 'common/enums/privileges';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) { }

  @Get('explore')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  async exploreJobs(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search: string,
    @Req() req: Request
  ) {
    return this.jobService.getAllJobs(page, perPage, search, req);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_GET_JOBS_POSTED)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @Get('my-postings')
  async getMyJobPostings(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req?: Request,
  ) {
    const userId = req.user['id'];
    return this.jobService.getMyJobPostings(userId, page, perPage, req);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_APPLY_FOR_JOB)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @Get('my-applications')
  async getMyJobApplications(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req?: Request,
  ) {
    const userId = req.user['id'];
    return this.jobService.getMyJobApplications(userId, page, perPage, req);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_CREATE_JOB)
  @Post('create')
  async createJob(@Req() req: Request, @Body() createJobDto: CreateJobDto) {
    const user = req.user;
    return this.jobService.createJob(user, createJobDto);
  }

  // 9044811783
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_UPDATE_JOB)
  @Patch(':jobId/update')
  async updateJob(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    const user = req.user;
    return await this.jobService.updateJob(user, jobId, updateJobDto);
  }

  @Get('opening/:jobId')
  async getJobById(@Param('jobId') jobId: string) {
    return this.jobService.getJobById(jobId);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_DELETE_JOB)
  @Delete(':jobId')
  async deleteJob(@Req() req: Request, @Param('jobId') jobId: string) {
    const user = req.user;
    return this.jobService.deleteJob(user, jobId);
  }
}