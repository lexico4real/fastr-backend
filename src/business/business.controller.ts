import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('business')
@ApiTags('business')
@UseGuards(AuthGuard())
@ApiBearerAuth('token')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('profile/create')
  createBusinessProfile(
    @Body() createBusinessDto: CreateBusinessDto,
    @Req() req: Request,
  ) {
    return this.businessService.createBusinessProfile(createBusinessDto, req);
  }

  @Patch('profile/update')
  updateBusinessProfile(
    @Body() updateBusinessDto: UpdateBusinessDto,
    @Req() req: Request,
  ) {
    return this.businessService.updateBusinessProfile(updateBusinessDto, req);
  }
}
