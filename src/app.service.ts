import { Injectable } from '@nestjs/common';
import * as packageInfo from '../package.json';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: packageInfo.name,
      version: packageInfo.version,
      description: packageInfo.description,
      author: packageInfo.author,
      license: packageInfo.license,
      contact: {
        email: 'support@fastr.com',
        website: 'https://www.fastr.com',
      },
    };
  }
}