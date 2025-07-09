import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { AllPrivileges } from 'common/enums/privileges';

@Controller('ratings')
@ApiTags('ratings')
@ApiBearerAuth('token')
@UseGuards(AuthGuard(), PrivilegesGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Privileges(AllPrivileges.CAN_RATE_STUDENT)
  @Post('student/:jobId')
  async rateStudent(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateRatingDto,
    @Req() req: Request,
  ) {
    return this.ratingService.createRating(jobId, req.user?.['id'], dto);
  }

  @Privileges(AllPrivileges.CAN_RATE_COMPANY)
  @Post('business/:jobId')
  async rateBusiness(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateRatingDto,
    @Req() req: Request,
  ) {
    return this.ratingService.createRating(jobId, req.user?.['id'], dto);
  }

  @Privileges(AllPrivileges.CAN_RATE_STUDENT)
  @Get('student/:studentId')
  async getStudentRatings(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.ratingService.getRatingsForStudent(studentId);
  }

  @Privileges(AllPrivileges.CAN_RATE_COMPANY)
  @Get('business/:businessId')
  async getBusinessRatings(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.ratingService.getRatingsForBusiness(businessId);
  }
}
