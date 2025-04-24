import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../dto/create-user.dto';
import { isEmail } from 'class-validator';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async registerAccount(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({
      ...createUserDto,
      email: email.toLowerCase(),
      password: hashedPassword,
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

  async getUserByEmail(email: string): Promise<User> {
    if (!isEmail(email)) {
      throw new BadRequestException('This is not a valid email.');
    }
    const user = await this.findOne({ where: { email } });

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
        relations: ['roles'],
      });
    } catch (error) {
      throw new Error('Something went wrong')
    }
  }
}