import { AccessDto } from './dto/access.dto';
import {
  Injectable,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
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

@Injectable()
export class AuthService {
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
  ) { }

  async signUp(createUserDto: CreateUserDto): Promise<void> {
    const user = await this.usersRepository.registerAccount(createUserDto);

    await this.emailService.sendMail({
      to: user.email,
      subject: 'New Account',
      text: `Welcome ${user.firstName}! This is a confirmation of the New Account You opened with us.`,
    });
  }

  async getLoginOTP(authCredentialsDto: AuthCredentialsDto, userData: any) {
    const { email, password } = authCredentialsDto;
    const normalizedEmail = email.toLowerCase();
    let user: User;
    if (!userData) {
      user = await this.usersRepository.getUserByEmail(normalizedEmail);
    } else {
      user = userData;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    delete user.password;

    const { phoneNumber, email: _email } = user;

    const token = await this.otpService.generateOtp(
      {
        phoneNumber,
      },
      user,
    );

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

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
    session: any,
  ): Promise<{ accessToken: any }> {
    const { email, password, secret, otp } = authCredentialsDto;

    const normalizedEmail = email.toLowerCase();

    const user = await this.usersRepository.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
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
      roles: user.userRole,
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

    delete user.password;

    session.currentUser = {
      ...user,
    };

    return { accessToken, ...user };
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

  async createPrivilege(accessDto: AccessDto) {
    return await this.userPrivilegeRepository.createPrivilege(accessDto);
  }

  verifyJwt(token: string) {
    return this.jwtService.verify(token);
  }

  async findUserById(id: string): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException('This is not a valid ID')
    }
    return await this.usersRepository.findUserById(id);
  }
}