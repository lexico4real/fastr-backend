import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      delete user.password;
      return user;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to retrieve user profile');
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) throw new NotFoundException('User not found');

      const profile = user.profile;

      if (!profile) throw new NotFoundException('Profile not found');

      Object.assign(profile, dto);

      return await this.profileRepository.save(profile);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  async getProfileById(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid user ID provided');
    }
    try {
      const profile = await this.profileRepository.findOne({ where: { id } });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      return profile;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to retrieve profile by ID');
    }
  }
}
