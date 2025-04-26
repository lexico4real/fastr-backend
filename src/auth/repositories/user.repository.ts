import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../dto/create-user.dto';
import { isEmail } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountStatus } from 'common/enums/account-status';

export class UserRepository extends Repository<User> {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super(
      userRepository.target,
      userRepository.manager,
      userRepository.queryRunner,
    );
  }
  async registerAccount(createUserDto: CreateUserDto, role: any): Promise<User> {
    const { email, password } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({
      ...createUserDto,
      email: email.toLowerCase(),
      password: hashedPassword,
      userRole: role || null,
    });

    try {
      await this.save(user);
      return user;
    } catch (error) {
      if (
        error.code === '23505' ||
        error.message.includes('duplicate key value violates unique constraint')
      ) {
        throw new ConflictException('Account email already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async confirmAccount(payload: any): Promise<{ message: string, user: User }> {
    
    const user = await this.findOne({ where: { email: payload.email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isConfirmed = true;
    user.accountStatus = AccountStatus.ACTIVE;
    await this.save(user);

    return { message: 'Account confirmed successfully!', user };
  }

  async getUserByEmail(email: string): Promise<User> {
    if (!isEmail(email)) {
      throw new BadRequestException('This is not a valid email.');
    }
    const user = await this.findOne({
      where: { email },
      relations: ['userRole', 'userRole.userPrivileges']
    });

    if (!user) {
      throw new NotFoundException(
        'Wrong email/password. Please check your login credentials',
      );
    }
    return user;
  }

  async findUserById(id: string): Promise<User> {
    try {
      return await this.findOne({
        where: { id },
        relations: ['userRole', 'userRole.privileges'],
      });
    } catch (error) {
      throw new Error('Something went wrong')
    }
  }
}