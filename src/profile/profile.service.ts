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
import { ProfileType } from 'common/enums/profile-type';
import { UpdateWorkPermitDto } from './dto/update-work-permit.dto';

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
        this.logger.log(
          'ProfileService',
          'error',
          'User not found',
          'profile-service',
        );
        throw new NotFoundException('User not found');
      }
      delete user.password;
      this.logger.log(
        'ProfileService',
        'info',
        `Retrieved profile for user ID: ${userId}`,
        'profile-service',
      );
      return user;
    } catch (error) {
      this.logger.log(
        'ProfileService',
        'error',
        `Failed to retrieve user profile: ${error}`,
        'profile-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to retrieve user profile');
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    if (dto.phoneNumber) {
      throw new BadRequestException(
        'You cannot update your phone number. Kindly contact admin',
      );
    }
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) {
        this.logger.log(
          'ProfileService',
          'error',
          'User not found',
          'profile-service',
        );
        throw new NotFoundException('User not found');
      }

      let profile = user.profile;

      if (user.userRole.name !== 'STUDENT') {
        if (
          dto.resumeUrl ||
          dto.skills.length ||
          dto.education ||
          dto.availability
        ) {
          throw new BadRequestException(
            'Only students can update resume, skills, education, or availability',
          );
        }
        profile.profileType = ProfileType.BUSINESS;
      }

      if (dto.profilePhotoUrl) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            dto.profilePhotoUrl,
            {
              folder: 'profile_photos',
              public_id: `user_${userId}`,
              overwrite: true,
            },
          );
          dto.profilePhotoUrl = uploadResult.secure_url;
        } catch (error) {
          this.logger.log(
            'ProfileService',
            'error',
            `Failed to upload profile photo: ${error}`,
            'profile-service',
          );
          throw new InternalServerErrorException(
            'Failed to upload profile photo',
          );
        }
      }

      if (!profile) {
        profile = this.profileRepository.create({ user, ...dto });
      } else {
        Object.assign(profile, dto);
      }

      const updatedProfile = await this.profileRepository.save(profile);
      this.logger.log(
        'ProfileService',
        'info',
        `Updated profile for user ID: ${userId}`,
        'profile-service',
      );
      return updatedProfile;
    } catch (error) {
      console.log(error);
      this.logger.log(
        'ProfileService',
        'error',
        `Failed to update profile: ${error}`,
        'profile-service',
      );

      if (
        error.code === '23505' ||
        error.message.includes('duplicate key value violates unique constraint')
      ) {
        throw new BadRequestException('Profile already exists for this user');
      }

      throw error instanceof NotFoundException
        ? error
        : error instanceof BadRequestException
          ? error
          : new InternalServerErrorException('Failed to update profile');
    }
  }

  async updateWorkPermit(
    dto: UpdateWorkPermitDto,
  ): Promise<Profile> {
    try {
      const userId = dto.userId;
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const profileId = user.profile?.id;
      if (!profileId) {
        throw new NotFoundException('Profile not found for this user');
      }
      const profile = await this.profileRepository.findOne({
        where: { id: profileId },
      });
      if (!profile) {
        throw new NotFoundException('Profile not found for this user');
      }
      profile.isWorkPermitVerified = dto.isWorkPermitVerified;

      const updatedProfile = await this.profileRepository.save(profile);
      return updatedProfile;
    } catch (error) {
      this.logger.log(
        'ProfileService',
        'error',
        `Failed to update work permit: ${error}`,
        'profile-service',
      );

      if (
        error.code === '23505' ||
        error.message.includes('duplicate key value violates unique constraint')
      ) {
        throw new BadRequestException('Work permit already exists for this user');
      }

      throw error instanceof NotFoundException
        ? error
        : error instanceof BadRequestException
          ? error
          : new InternalServerErrorException('Failed to update work permit');
    }
  }
}
