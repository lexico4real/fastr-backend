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
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { AuthGuard } from '@nestjs/passport';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { AllPrivileges } from 'common/enums/privileges';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JobStatus } from 'common/enums/job-status';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('explore')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'salary', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'company', required: false })
  @ApiQuery({
    name: 'requiredSkills',
    required: false,
    type: String,
    description: 'Comma-separated required skill list',
  })
  @ApiQuery({ name: 'datePosted', required: false })
  async exploreJobs(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('title') title: string,
    @Query('location') location: string,
    @Query('salary') salary: string,
    @Query('company') company: string,
    @Query('requiredSkills') requiredSkills: string,
    @Query('datePosted') datePosted: string,
    @Query('status') status: JobStatus,
    @Req() req: Request,
  ) {
    return this.jobService.getAllJobs(
      page,
      perPage,
      {
        title,
        location,
        salary,
        company,
        requiredSkills: requiredSkills?.split(',').map((skill) => skill.trim()),
        datePosted,
        status,
      },
      req,
    );
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_GET_JOBS_POSTED)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @Get('my-postings')
  async getMyJobPostings(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req?: Request,
  ) {
    return this.jobService.getMyJobPostings(page, perPage, req);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_APPLY_FOR_JOB)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @Get('my-applications')
  async getMyJobApplications(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Req() req?: Request,
  ) {
    return this.jobService.getMyJobApplications(page, perPage, req);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_CREATE_JOB)
  @Post('create')
  async createJob(@Req() req: Request, @Body() createJobDto: CreateJobDto) {
    const user = req.user;
    return this.jobService.createJob(user, createJobDto);
  }

  // 9044811783
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_UPDATE_JOB)
  @Patch(':jobId/update')
  async updateJob(
    @Req() req: Request,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    const user = req.user;
    return await this.jobService.updateJob(user, jobId, updateJobDto);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_UPDATE_JOB)
  @Patch(':jobId/update/status')
  async updateJobStatus(
    @Req() req: Request,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body('status') status: string,
  ) {
    const user = req.user;
    return await this.jobService.updateJobStatus(user, jobId, status);
  }

  @Get('opening/:jobId')
  async getJobById(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobService.getJobById(jobId);
  }

  @ApiBearerAuth('token')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_DELETE_JOB)
  @Delete(':jobId')
  async deleteJob(
    @Req() req: Request,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    const user = req.user;
    return this.jobService.deleteJob(user, jobId);
  }
}
