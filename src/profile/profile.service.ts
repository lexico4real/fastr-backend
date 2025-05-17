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
import Logger from 'config/logger';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger();

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
        this.logger.log('ProfileService', 'error', 'User not found', 'profile-service');
        throw new NotFoundException('User not found');
      }
      delete user.password;
      this.logger.log('ProfileService', 'info', `Retrieved profile for user ID: ${userId}`, 'profile-service');
      return user;
    } catch (error) {
      this.logger.log('ProfileService', 'error', `Failed to retrieve user profile: ${error.message}`, 'profile-service');
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

      if (!user) {
        this.logger.log('ProfileService', 'error', 'User not found', 'profile-service');
        throw new NotFoundException('User not found');
      }

      const profile = user.profile;

      if (!profile) {
        this.logger.log('ProfileService', 'error', 'Profile not found', 'profile-service');
        throw new NotFoundException('Profile not found');
      }

      Object.assign(profile, dto);

      const updatedProfile = await this.profileRepository.save(profile);
      this.logger.log('ProfileService', 'info', `Updated profile for user ID: ${userId}`, 'profile-service');
      return updatedProfile;
    } catch (error) {
      this.logger.log('ProfileService', 'error', `Failed to update profile: ${error.message}`, 'profile-service');
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  async getProfileById(id: string) {
    if (!isUUID(id)) {
      this.logger.log('ProfileService', 'error', 'Invalid user ID provided', 'profile-service');
      throw new BadRequestException('Invalid user ID provided');
    }
    try {
      const profile = await this.profileRepository.findOne({ where: { id } });

      if (!profile) {
        this.logger.log('ProfileService', 'error', 'Profile not found', 'profile-service');
        throw new NotFoundException('Profile not found');
      }

      this.logger.log('ProfileService', 'info', `Retrieved profile by ID: ${id}`, 'profile-service');
      return profile;
    } catch (error) {
      this.logger.log('ProfileService', 'error', `Failed to retrieve profile by ID: ${error.message}`, 'profile-service');
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to retrieve profile by ID');
    }
  }
}
