import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('ratings')
@ApiTags('ratings')
@ApiBearerAuth('token')
@UseGuards(AuthGuard())
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post('student/:jobId')
  async rateStudent(
    @Param('jobId') jobId: string,
    @Body() dto: CreateRatingDto,
    @Req() req: Request,
  ) {
    return this.ratingService.createRating(jobId, req.user?.['id'], dto);
  }

  @Post('business/:jobId')
  async rateBusiness(
    @Param('jobId') jobId: string,
    @Body() dto: CreateRatingDto,
    @Req() req: Request,
  ) {
    return this.ratingService.createRating(jobId, req.user?.['id'], dto);
  }

  @Get('student/:studentId')
  async getStudentRatings(@Param('studentId') studentId: string) {
    return this.ratingService.getRatingsForStudent(studentId);
  }

  @Get('business/:businessId')
  async getBusinessRatings(@Param('businessId') businessId: string) {
    return this.ratingService.getRatingsForBusiness(businessId);
  }
}
