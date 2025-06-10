import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AssignPrivilegeDto } from './dto/assign-privilege.dto';
import { AccessDto } from './dto/access.dto';
import {
  Injectable,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { FindManyOptions, ILike } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRoleRepository } from './repositories/user-role.repository';
import { UserPrivilegeRepository } from './repositories/user-privilege.repository';
import { UserRepository } from './repositories/user.repository';
import { EmailService } from 'src/email/email.service';
import { AuthCredentialsDto } from './dto/auth-credential.dto';
import { generatePagination } from 'common/utils/pagination';
import { JwtPayload } from './jwt-payload-interface';
import { OtpService } from 'src/otp/otp.service';
import { isUUID } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from 'src/cache/cache.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { NewPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { RolesConstant } from 'common/enums/roles';
import { isUkAcademicEmail } from 'common/utils/custom-validations/university-email';
import { isBusinessEmail } from 'common/utils/custom-validations/business-email';
import Logger from 'config/logger';

@Injectable()
export class AuthService {
  private readonly logger = new Logger();
  constructor(
    @InjectRepository(UserRepository)
    private usersRepository: UserRepository,
    @InjectRepository(UserRoleRepository)
    private userRoleRepository: UserRoleRepository,
    @InjectRepository(UserPrivilegeRepository)
    private userPrivilegeRepository: UserPrivilegeRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly cacheService: CacheService,
  ) {}

  async signUp(createUserDto: CreateUserDto, req: Request): Promise<void> {
    try {
      const { role, email } = createUserDto;

      const userInDB = await this.usersRepository.findOne({
        where: { email },
      });
      if (userInDB) {
        throw new ConflictException('Account with this email already exists');
      }

      const roleData = await this.userRoleRepository.getRoleByName(role);
      if (!roleData) {
        throw new BadRequestException('Invalid role specified.');
      }

      if (role === RolesConstant.STUDENT && !isUkAcademicEmail(email)) {
        throw new BadRequestException(
          'Only UK university emails ending in .ac.uk are allowed.',
        );
      } else if (
        [
          RolesConstant.ADMIN,
          RolesConstant.BUSINESS,
          RolesConstant.BUSINESS_ADMIN,
        ].includes(role) &&
        !isBusinessEmail(email)
      ) {
        throw new BadRequestException(
          'Public email domains are not allowed. Please use a business email address.',
        );
      }

      const user = await this.usersRepository.registerAccount(
        createUserDto,
        roleData,
      );

      const token = this.generateConfirmationToken(user);

      await this.sendConfirmationEmail(user.email, token, req);
    } catch (error) {
      this.logger.log(
        'sign-up',
        'error',
        `Registration error: ${error.message}`,
        'auth.service',
      );
      throw error instanceof BadRequestException
        ? error
        : error instanceof ConflictException
          ? error
          : new InternalServerErrorException(
              'Something went wrong while creating the user account',
            );
    }
  }

  async confirmAccount(token: string): Promise<{ message: string }> {
    try {
      const payload = this.verifyConfirmationToken(token);
      if (payload) {
        const { email } = payload;
        const user = await this.usersRepository.getUserByEmail(email);
        if (user?.isEmailVerified) {
          throw new BadRequestException('Email already verified');
        }
      }

      const result = await this.usersRepository.confirmAccount(payload);

      await this.emailService.sendMail({
        to: result.user.email,
        subject: 'New Account',
        text: '',
        html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://via.placeholder.com/150x50?text=Company+Logo" alt="Company Logo" style="height: 50px;">
        </div>
        <h2 style="color: #0056b3;">Welcome!</h2>
        <p>Thank you for opening a new account with us. We're thrilled to have you on board and look forward to supporting your journey. Kindly update your profile.</p>
        <p>If you have any questions, feel free to reach out to our support team at any time.</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>The Team</strong></p>
      </div>
    `,
      });
      delete result.user.password;
      return result;
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Something went wrong');
    }
  }

  async resendVerificationEmail(
    resendVerificationDto: ResendVerificationDto,
    req: Request,
  ): Promise<void> {
    const { email } = resendVerificationDto;
    const user = await this.usersRepository.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }
    const token = this.generateConfirmationToken(user);
    await this.sendConfirmationEmail(user.email, token, req);
  }

  async getLoginOTP(authCredentialsDto: AuthCredentialsDto, roleType?: string) {
    const { email, password } = authCredentialsDto;
    const normalizedEmail = email.toLowerCase();

    const user = await this.usersRepository.getUserByEmail(normalizedEmail);

    if (
      !user ||
      (roleType &&
        user?.userRole?.name?.toLowerCase() !== roleType?.toLowerCase())
    ) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials.',
      );
    }

    if (
      !(
        user?.userRole?.name === RolesConstant.ADMIN ||
        user?.userRole?.name === RolesConstant.SUPER_ADMIN
      )
    ) {
      throw new UnauthorizedException(
        'You are not authorized to access this endpoint. Please use the business/student login.',
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'This account is yet to be confirmed. Request a confirmation email.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    delete user.password;

    const { email: _email } = user;

    const token = await this.otpService.generateOtp({ email }, user);

    await this.emailService.sendMail({
      to: _email,
      subject: 'Login OTP',
      text: `Your Login OTP is ${token?.otp}`,
    });

    return {
      secret: token?.secret || null,
      statuscode: HttpStatus.OK,
      message: `OTP sent successfully to your registered email: ${_email}`,
    };
  }

  async signIn2Factor(
    authCredentialsDto: AuthCredentialsDto,
    session: any,
  ): Promise<{ accessToken: string; refreshToken: string } & User> {
    const { email, password, secret, otp } = authCredentialsDto;

    const normalizedEmail = email.toLowerCase();

    const user = await this.usersRepository.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    if (
      !(
        user?.userRole?.name === RolesConstant.ADMIN ||
        user?.userRole?.name === RolesConstant.SUPER_ADMIN
      )
    ) {
      throw new UnauthorizedException(
        'You are not authorized to access this endpoint. Please use the business/student login.',
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'This account is yet to be confirmed. Request a confirmation email.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    const payload: JwtPayload = {
      email: normalizedEmail,
      role: user.userRole,
    };

    const { otpIsValid } = await this.otpService.validateOtp(
      secret,
      otp,
      'LOGIN',
    );
    if (!otpIsValid) {
      throw new BadRequestException('Invalid/expired OTP');
    }

    const accessToken: string = await this.jwtService.sign(payload);

    const refreshToken = await this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    delete user.password;

    session.currentUser = {
      ...user,
    };

    await this.cacheService.set(
      `session:${user.id}:${accessToken}`,
      'active',
      60 * 60 * 24,
    );
    await this.cacheService.set(
      `refresh:${user.id}:${refreshToken}`,
      'active',
      60 * 60 * 24 * 7,
    );

    return { accessToken, refreshToken, ...user };
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
    session: any,
  ): Promise<{ accessToken: string; refreshToken: string } & User> {
    const { email, password, otp } = authCredentialsDto;

    const normalizedEmail = email.toLowerCase();

    const user = await this.usersRepository.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    if (
      user?.userRole?.name === RolesConstant.ADMIN ||
      user?.userRole?.name === RolesConstant.SUPER_ADMIN
    ) {
      throw new UnauthorizedException(
        'Admin accounts cannot log in through this endpoint. Please use the admin panel.',
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'This account is yet to be confirmed. Request a confirmation email.',
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'This account is yet to be confirmed. Request a confirmation email.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    const payload: JwtPayload = {
      email: normalizedEmail,
      role: user.userRole,
    };

    const accessToken: string = await this.jwtService.sign(payload);

    const refreshToken: string = await this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    delete user.password;

    session.currentUser = {
      ...user,
    };

    await this.cacheService.set(
      `session:${user.id}:${accessToken}`,
      'active',
      60 * 60 * 24,
    );
    await this.cacheService.set(
      `refresh:${user.id}:${refreshToken}`,
      'active',
      60 * 60 * 24 * 7,
    );

    return { accessToken, refreshToken, ...user };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.getUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.cacheService.get(
      `refresh:${user.id}:${refreshToken}`,
    );
    if (isValid !== 'active') {
      throw new UnauthorizedException(
        'Refresh token is invalid or has been revoked',
      );
    }

    const newAccessToken = this.jwtService.sign(
      { email: user.email, role: user.userRole },
      { expiresIn: '15m' },
    );

    await this.cacheService.set(
      `session:${user.id}:${newAccessToken}`,
      'active',
      60 * 60 * 24,
    );

    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.getUserByEmail(payload.email);
      if (user) {
        await this.cacheService.delete(`refresh:${user.id}:${refreshToken}`);
      }
    } catch {}
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, req: Request) {
    const { email } = forgotPasswordDto;

    const user = await this.usersRepository.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = uuidv4();

    await this.cacheService.set(
      `reset-password:${user.id}`,
      resetToken,
      60 * 15,
    );

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const resetLink = `${baseUrl}/api/v1/auth/reset-password?token=${resetToken}&userId=${user.id}`;

    // const templatePath = join(__dirname, 'common/templates', 'templates', 'reset-password.html');
    // let html = readFileSync(templatePath, 'utf8');
    // html = html.replace('{{RESET_LINK}}', resetLink);

    const html = `
      <html>
        <body>
          <h2>Password Reset Request</h2>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}" style="padding: 10px 20px; background-color:#0056b3); color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </body>
      </html>
      `;

    await this.emailService.sendMail({
      to: user.email,
      subject: 'Password Reset',
      text: '',
      html,
    });

    return {
      message: 'Password reset link has been sent to your email',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    newPasswordDto: NewPasswordDto,
  ) {
    const { userId, token } = resetPasswordDto;
    const { newPassword } = newPasswordDto;

    const storedToken = await this.cacheService.get(`reset-password:${userId}`);
    if (!storedToken || storedToken !== token) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await this.usersRepository.save(user);

    await this.cacheService.delete(`reset-password:${userId}`);

    return {
      message: 'Password has been reset successfully',
    };
  }

  async getAllUsers(
    page = 1,
    perPage = 10,
    search: string,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const skip = (page - 1) * perPage;

      const where: FindManyOptions<User>['where'] = search
        ? [{ email: ILike(`%${search}%`) }]
        : undefined;

      const [result, total] = await this.usersRepository.findAndCount({
        where,
        order: { email: 'ASC' },
        skip,
        take: perPage,
      });

      for (const user of result) delete user.password;

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException('Some thing went wrong: AS-ERROR');
    }
  }

  async createRole(accessDto: AccessDto) {
    return await this.userRoleRepository.createRole(accessDto);
  }

  async getAllRoles(
    page: number,
    perPage: number,
    search: string,
    @Req() req: Request,
  ) {
    return await this.userRoleRepository.getAllRoles(
      page,
      perPage,
      search,
      req,
    );
  }

  async getRoleById(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid Role ID');
    }
    return await this.userRoleRepository.getRoleById(id);
  }

  async createPrivilege(accessDto: AccessDto) {
    return await this.userPrivilegeRepository.createPrivilege(accessDto);
  }

  async getAllPrivileges(
    page: number,
    perPage: number,
    search: string,
    @Req() req: Request,
  ) {
    return await this.userPrivilegeRepository.getAllPrivileges(
      page,
      perPage,
      search,
      req,
    );
  }

  verifyJwt(token: string) {
    return this.jwtService.verify(token);
  }

  async findUserById(id: string): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException('This is not a valid ID');
    }
    return await this.usersRepository.findUserById(id);
  }

  private verifyConfirmationToken(token: string): any {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.EMAIL_CONFIRMATION_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired confirmation token');
    }
  }

  private generateConfirmationToken(user: User): string {
    const payload = { email: user.email };
    return this.jwtService.sign(payload, {
      secret: process.env.EMAIL_CONFIRMATION_SECRET,
      expiresIn: '1d',
    });
  }

  private async sendConfirmationEmail(
    email: string,
    token: string,
    req: Request,
  ): Promise<void> {
    let param: string;
    if (!isUkAcademicEmail(email)) {
      param = 'verify-business-email';
    } else {
      param = 'verify-university-email';
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const confirmationUrl = `${baseUrl}/api/v1/auth/student/${param}?token=${token}`;

    await this.emailService.sendMail({
      to: email,
      subject: 'Confirm your account',
      text: '',
      html: `
        <p>Hi,</p>
        <p>Please click the link below to confirm your account:</p>
        <a href="${confirmationUrl}">${confirmationUrl}</a>
      `,
    });
  }

  async assignPrivilege(assignPrivilegeDto: AssignPrivilegeDto) {
    const { roleId, privilegeIds } = assignPrivilegeDto;
    try {
      const role = await this.userRoleRepository.findOne({
        where: { id: roleId },
        relations: ['userPrivileges'],
      });

      let availablePrivs = [];
      let unAvailablePrivs = [];
      privilegeIds.forEach(async (id) => {
        const privilege = await this.userPrivilegeRepository.findOne({
          where: { id },
        });
        if (privilege) {
          availablePrivs.push(privilege);
        } else {
          unAvailablePrivs.push(privilege);
        }
      });

      if (role) {
        role.userPrivileges = availablePrivs;
        await this.userRoleRepository.save(role);
      } else {
      }
    } catch (error) {}
  }

  async getMyProfile(userId: string) {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    delete user.password;
    return user;
  }
}
