import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { AccessDto } from './dto/access.dto';
import { Role } from 'common/enums/roles';
import { AuthCredentialsDto } from './dto/auth-credential.dto';

@ApiTags('users')
@Controller('users')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('token')
  createBankStaff(@Body() createUserDto: CreateUserDto): Promise<void> {
    return this.authService.signUp(createUserDto);
  }

  @Post('customer')
  @ApiBearerAuth('token')
  createCustomer(@Body() createUserDto: CreateUserDto): Promise<void> {
    createUserDto.role = Role.TALENT;
    return this.authService.signUp(createUserDto);
  }

  @HttpCode(200)
  @Post('otp')
  getLoginOTP(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Req() req: Request,
  ) {
    return this.authService.getLoginOTP(authCredentialsDto, req.user);
  }

  @HttpCode(200)
  @Post('sign-in')
  validateLoginOtp(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Session() session?: any,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto, session);
  }

  @Get()
  @UseGuards(AuthGuard())
  @ApiBearerAuth('token')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllCustomers(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search: string,
    @Req() req: Request,
  ): Promise<any> {
    return this.authService.getAllUsers(page, perPage, search, req);
  }

  @UseGuards(AuthGuard())
  @Post('role')
  async createRole(@Body() accessDto: AccessDto) {
    return await this.authService.createRole(accessDto);
  }

  @UseGuards(AuthGuard())
  @Post('role/privilege')
  async createPrivilege(@Body() accessDto: AccessDto) {
    return await this.authService.createPrivilege(accessDto);
  }
}