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

function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? !publicEmailDomains.includes(domain) : false;
}

@ValidatorConstraint({ name: 'IsBusinessEmail', async: false })
export class IsBusinessEmailConstraint implements ValidatorConstraintInterface {
  validate(email: any, _args: ValidationArguments): boolean {
    return typeof email === 'string' && isBusinessEmail(email);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Public email domains are not allowed. Please use a business email address.';
  }
}

export function IsBusinessEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsBusinessEmail',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsBusinessEmailConstraint,
    });
  };
}
