import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsUrlArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUrlArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) {
            return false;
          }

          return value.every(url => {
            try {
              new URL(url);
              return true;
            } catch {
              return false;
            }
          });
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an array of valid URLs`;
        },
      },
    });
  };
}
