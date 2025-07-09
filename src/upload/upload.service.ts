import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import Logger from 'config/logger';

@Injectable()
export class UploadService {
  private readonly logger = new Logger();
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, retries = 3): Promise<any> {
    if (!file) throw new BadRequestException('File not found');
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(file.buffer);
      });
      return result;
    } catch (error) {
      this.logger.log(
        'ProfileService',
        'error',
        `Failed to upload profile photo: ${error}`,
        'profile-service',
      );
      if (retries > 0 && error.error?.http_code == 499) {
        console.log(`Retrying upload... Attempts left: ${retries - 1}`);
        return this.uploadImage(file, retries - 1);
      }
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }
}
