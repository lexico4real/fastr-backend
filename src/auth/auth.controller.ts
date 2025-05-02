import { AssignPrivilegeDto } from './dto/assign-privilege.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Session,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { AccessDto } from './dto/access.dto';
import { RolesConstant } from 'common/enums/roles';
import { AuthCredentialsDto } from './dto/auth-credential.dto';
import { Privileges } from './decorators/privileges.decorator';
import { PrivilegesGuard } from './guards/privileges.guard';
import { PrivilegesConstant } from 'common/enums/privileges';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { NewPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(200)
  @Post('otp')
  getLoginOTP(
    @Body() authCredentialsDto: AuthCredentialsDto
  ) {
    return this.authService.getLoginOTP(authCredentialsDto);
  }

  @HttpCode(200)
  @Post('sign-in')
  validateLoginOtp(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Session() session?: any,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto, session);
  }

  @UseGuards(AuthGuard())
  @Post('logout')
  async logout(@Req() req: Request) {
    const userId = req.user['id'];
    const token = req.headers.authorization?.split(' ')[1];

    return await this.authService.logout(userId, token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() newPasswordDto: NewPasswordDto, @Query() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto, newPasswordDto);
  }

  @HttpCode(200)
  @Post('otp/:admin')
  getLoginOTPAdmin(
    @Param('admin') admin: string,
    @Body() authCredentialsDto: AuthCredentialsDto
  ) {
    return this.authService.getLoginOTP(authCredentialsDto, admin);
  }

  @Post('user/role')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_CREATE_ROLE)
  @ApiBearerAuth('token')
  async createRole(@Body() accessDto: AccessDto) {
    return await this.authService.createRole(accessDto);
  }

  @Get('users')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_CREATE_ROLE)
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

  @Get('user/roles')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @ApiBearerAuth('token')
  @Privileges(PrivilegesConstant.CAN_VIEW_ROLES)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAllRoles(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search: string,
    @Req() req: Request,
  ) {
    return await this.authService.getAllRoles(page, perPage, search, req);
  }

  @Get('talent/confirm')
  async confirmAccount(@Query('token') token: string): Promise<{ message: string }> {
    return this.authService.confirmAccount(token);
  }

  @Get('role/privileges')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_VIEW_PRIVILEGES)
  @ApiBearerAuth('token')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAllPrivileges(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search: string,
    @Req() req: Request,
  ) {
    return await this.authService.getAllPrivileges(page, perPage, search, req);
  }

  @Get('user/role/:id')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @ApiBearerAuth('token')
  @Privileges(PrivilegesConstant.CAN_VIEW_ROLES)
  async getRoleById(@Param('id') id: string) {
    return await this.authService.getRoleById(id);
  }

  @Post('role/privilege')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_CREATE_PRIVILEGE)
  @ApiBearerAuth('token')
  async createPrivilege(@Body() accessDto: AccessDto) {
    return await this.authService.createPrivilege(accessDto);
  }

  @Post('assign/privileges')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_ASSIGN_PRIVILEGES)
  @ApiBearerAuth('token')
  async assignPrivilege(@Body() assignPrivilegeDto: AssignPrivilegeDto) {
    return await this.authService.assignPrivilege(assignPrivilegeDto)
  }

  @Post('register/staff')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_VIEW_USERS)
  @ApiBearerAuth('token')
  @ApiBearerAuth('token')
  registerStaff(@Body() createUserDto: CreateUserDto): Promise<void> {
    return this.authService.signUp(createUserDto);
  }

  @Post('register/talent')
  registerTalent(@Body() createUserDto: CreateUserDto): Promise<void> {
    createUserDto.role = RolesConstant.TALENT;
    return this.authService.signUp(createUserDto);
  }
}