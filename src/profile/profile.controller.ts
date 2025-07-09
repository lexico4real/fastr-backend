import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  Param,
  Req,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { AllPrivileges } from 'common/enums/privileges';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { UpdateWorkPermitDto } from './dto/update-work-permit.dto';

@Controller('profile')
@ApiTags('profile')
@UseGuards(AuthGuard())
@ApiBearerAuth('token')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('me')
  async getProfile(@GetUser() user: any) {
    return this.profileService.getProfile(user.id);
  }

  @Patch('update')
  async updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user['id'];
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  @Get('user/:id')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_VIEW_USER_PROFILE)
  async getProfileById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.profileService.getProfile(id);
  }

  @Patch('profile-image')
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userId = req.user['id'];
    const result = await this.uploadService.uploadImage(file);
    return this.profileService.updateProfile(userId, {
      profilePhotoUrl: result.secure_url,
    });
  }

  // profile privacy
  @Patch('privacy')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_UPDATE_PROFILE_PRIVACY)
  async updateProfilePrivacy(
    @GetUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('verify-work-permit')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(AllPrivileges.CAN_UPDATE_WORK_PERMIT)
  async updateWorkPermit(
    @Body() updateWorkPermitDto: UpdateWorkPermitDto,
  ) {
    return this.profileService.updateWorkPermit(
      updateWorkPermitDto,
    );
  }
}
