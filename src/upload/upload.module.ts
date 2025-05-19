import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }),],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
