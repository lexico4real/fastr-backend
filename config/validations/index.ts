import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimInputPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          value[index] = this.transform(item, metadata);
        });
      } else {
        Object.keys(value).forEach((key) => {
          if (typeof value[key] === 'string') {
            value[key] = value[key].trim();
          } else if (value[key] && typeof value[key] === 'object') {
            value[key] = this.transform(value[key], metadata);
          }
        });
      }
    }
    return value;
  }
}
