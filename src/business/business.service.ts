import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from 'src/profile/entities/profile.entity';
import Logger from 'config/logger';

@Injectable()
export class BusinessService {
  private logger: Logger;
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {
    this.logger = new Logger();
  }

  async updateBusinessProfile(
    updateBusinessDto: UpdateBusinessDto,
    req: any,
  ): Promise<Business> {
    const user = req.user;
    const userProfile = user.profile;

    if (!userProfile) {
      throw new NotFoundException('User has no profile yet');
    }

    const profile = await this.profileRepository.findOne({
      where: { id: userProfile.id },
      relations: ['business'],
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    if (profile.profileType !== 'BUSINESS') {
      throw new NotFoundException('Profile is not a business profile');
    }
    if (!updateBusinessDto) {
      throw new NotFoundException('No update data provided');
    }

    if (!profile.business) {
      throw new NotFoundException('No business linked to this profile');
    }

    try {
      const updatedBusiness = Object.assign(
        profile.business,
        updateBusinessDto,
      );
      return this.businessRepository.save(updatedBusiness);
    } catch (error) {
      this.logger.log(
        'BusinessService',
        'error',
        `Failed to update business profile: ${error}`,
        'business-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update business profile');
    }
  }

  async createBusinessProfile(
    createBusinessDto: CreateBusinessDto,
    req: any,
  ): Promise<Profile> {
    const user = req.user;
    const userProfile = user.profile;

    try {
      const profile = await this.profileRepository.findOne({
        where: { id: userProfile.id },
        relations: ['business'],
      });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      if (profile.profileType !== 'BUSINESS') {
        throw new BadRequestException('Profile is not a business profile');
      }

      if (profile.businessId) {
        throw new ConflictException('Business already exists for this profile');
      }

      const { businessName, registrationNumber, address } = createBusinessDto;

      let business = await this.businessRepository.findOne({
        where: { registrationNumber },
      });

      if (!business) {
        business = this.businessRepository.create({
          businessName,
          registrationNumber,
          address,
        });

        business = await this.businessRepository.save(business);
      }

      profile.business = business;
      await this.profileRepository.save(profile);

      return profile;
    } catch (error) {
      this.logger.log(
        'ProfileService',
        'error',
        `Failed to create business profile: ${error?.message || error}`,
        'business-service',
      );

      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Failed to create business profile');
    }
  }
}
