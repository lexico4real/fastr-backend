import { AssignPrivilegeDto } from './dto/assign-privilege.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
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
import { AllPrivileges } from 'common/enums/privileges';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { NewPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard())
  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const userId = req.user['id'];
    return await this.authService.getMyProfile(userId);
  }

  @Get('users')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_VIEW_USERS)
  @ApiBearerAuth('token')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllUsers(
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
  @Privileges(AllPrivileges.CAN_VIEW_ROLES)
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

  @Get('student/verify-university-email')
  async confirmAccountStud(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.confirmAccount(token);
  }

  @Get('business/verify-business-email')
  async confirmAccountBiz(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.confirmAccount(token);
  }

  @Get('role/privileges')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_VIEW_PRIVILEGES)
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
  @Privileges(AllPrivileges.CAN_VIEW_ROLES)
  async getRoleById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.authService.getRoleById(id);
  }

  @HttpCode(200)
  @Post('otp')
  getLoginOTP(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.getLoginOTP(authCredentialsDto);
  }

  @HttpCode(200)
  @Post('login')
  validateLoginOtp(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Session() session?: any,
  ): Promise<{ accessToken: string }> {
    if (authCredentialsDto.secret && authCredentialsDto.otp) {
      return this.authService.signIn2Factor(authCredentialsDto, session);
    }
    return this.authService.signIn(authCredentialsDto, session);
  }

  @Post('refresh-token')
  async refreshAccessToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @UseGuards(AuthGuard())
  @ApiBearerAuth('token')
  @Post('logout')
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Req() req: Request,
  ) {
    return await this.authService.resendVerificationEmail(
      resendVerificationDto,
      req,
    );
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    return await this.authService.forgotPassword(forgotPasswordDto, req);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() newPasswordDto: NewPasswordDto,
    @Query() resetPasswordDto: ResetPasswordDto,
  ) {
    return await this.authService.resetPassword(
      resetPasswordDto,
      newPasswordDto,
    );
  }

  @HttpCode(200)
  @Post('otp/:admin')
  getLoginOTPAdmin(
    @Param('admin') admin: string,
    @Body() authCredentialsDto: AuthCredentialsDto,
  ) {
    return this.authService.getLoginOTP(authCredentialsDto, admin);
  }

  @Post('user/role')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_CREATE_ROLE)
  @ApiBearerAuth('token')
  async createRole(@Body() accessDto: AccessDto) {
    return await this.authService.createRole(accessDto);
  }

  @Post('role/privilege')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_CREATE_PRIVILEGE)
  @ApiBearerAuth('token')
  async createPrivilege(@Body() accessDto: AccessDto) {
    return await this.authService.createPrivilege(accessDto);
  }

  @Post('assign/privileges')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_ASSIGN_PRIVILEGES)
  @ApiBearerAuth('token')
  async assignPrivilege(@Body() assignPrivilegeDto: AssignPrivilegeDto) {
    return await this.authService.assignPrivilege(assignPrivilegeDto);
  }

  @Post('register/staff')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_CREATE_STAFF)
  @ApiBearerAuth('token')
  registerStaff(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ): Promise<void> {
    createUserDto.role = RolesConstant.BUSINESS;
    return this.authService.signUp(createUserDto, req);
  }

  @Post('register/admin')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_CREATE_ADMIN)
  @ApiBearerAuth('token')
  registerAdmin(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ): Promise<void> {
    createUserDto.role = RolesConstant.ADMIN;
    return this.authService.signUp(createUserDto, req);
  }

  @Post('register/student')
  signUpAsAStudent(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ): Promise<void> {
    createUserDto.role = RolesConstant.STUDENT;
    return this.authService.signUp(createUserDto, req);
  }

  @Post('register/business')
  signUpAsABusiness(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ): Promise<void> {
    createUserDto.role = RolesConstant.BUSINESS_ADMIN;
    return this.authService.signUp(createUserDto, req);
  }
}
