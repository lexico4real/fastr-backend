import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UploadService } from './upload.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { AllPrivileges } from 'common/enums/privileges';
import { Privileges } from 'src/auth/decorators/privileges.decorator';

@Controller('upload')
@ApiTags('upload')
@UseGuards(AuthGuard(), PrivilegesGuard)
@Privileges(AllPrivileges.CAN_UPLOAD_ANY_IMAGE)
@ApiBearerAuth('token')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadImage(file);
    return { url: result.secure_url };
  }
}
