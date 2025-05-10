import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const publicEmailDomains = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
  'tutanota.com',
  'fastmail.com',
  'hushmail.com',
  'lycos.com',
  'inbox.com',
  'mail.ru',
];

function isPublicEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return publicEmailDomains.includes(domain);
}

@ValidatorConstraint({ name: 'IsNotPublicEmail', async: false })
export class IsNotPublicEmailConstraint implements ValidatorConstraintInterface {
  validate(email: any, _args: ValidationArguments): boolean {
    return typeof email === 'string' && !isPublicEmail(email);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Public email domains are not allowed. Please use a business or university email.';
  }
}

export function IsNotPublicEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsNotPublicEmail',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsNotPublicEmailConstraint,
    });
  };
}

