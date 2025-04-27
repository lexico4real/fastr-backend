import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class ProfileService {
  constructor(private readonly authService: AuthService) { }

  async getProfile(userId: string): Promise<User> {
    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    delete user.password;
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.authService.findUserById(userId);

    if (!updateProfileDto.phoneNumber && !updateProfileDto.photo) {
      throw new BadRequestException('There is no data to update');
    }

    updateProfileDto.phoneNumber ??= user.phoneNumber;
    updateProfileDto.photo ??= user.photo;

    return this.authService.saveUpdate(userId, updateProfileDto as any);
  }

  async getProfileById(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid user ID provided');
    }
    return await this.authService.findUserById(id);
  }
}
