import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function isUkAcademicEmail(email: string): boolean {
  return typeof email === 'string' && email.toLowerCase().endsWith('.ac.uk');
}

@ValidatorConstraint({ name: 'IsUkAcademicEmail', async: false })
export class IsUkAcademicEmailConstraint
  implements ValidatorConstraintInterface
{
  validate(email: any, _args: ValidationArguments): boolean {
    return isUkAcademicEmail(email);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Only UK university emails ending in .ac.uk are allowed.';
  }
}

export function IsUkAcademicEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsUkAcademicEmail',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsUkAcademicEmailConstraint,
    });
  };
}
