import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import Logger from 'config/logger';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

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

      if (dto.profilePhotoUrl) {
        try {
          const uploadResult = await cloudinary.uploader.upload(dto.profilePhotoUrl, {
            folder: 'profile_photos',
            public_id: `user_${userId}`,
            overwrite: true,
          });
          dto.profilePhotoUrl = uploadResult.secure_url;
        } catch (uploadError) {
          this.logger.log('ProfileService', 'error', `Failed to upload profile photo: ${uploadError.message}`, 'profile-service');
          throw new InternalServerErrorException('Failed to upload profile photo');
        }
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
}
