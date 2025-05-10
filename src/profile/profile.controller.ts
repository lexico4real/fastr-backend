import { Body, Controller, Get, Patch, UseGuards, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { PrivilegesConstant } from 'common/enums/privileges';
import { Privileges } from 'src/auth/decorators/privileges.decorator';

@Controller('profile')
@ApiTags('profile')
@UseGuards(AuthGuard())
@ApiBearerAuth('token')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get('me')
  async getProfile(@GetUser() user: any) {
    return this.profileService.getProfile(user.id);
  }

  @Patch('update')
  async updateProfile(@Req() req: Request, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user['id'];
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  @Get('user/:id')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_VIEW_USER_PROFILE)
  async getProfileById(@Param('id') id: string) {
    return await this.profileService.getProfileById(id);
  }

  // profile privacy
  @Patch('privacy')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_UPDATE_PROFILE_PRIVACY)
  async updateProfilePrivacy(@GetUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }
}
