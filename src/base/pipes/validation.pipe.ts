import { ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { DataValidationException } from '../exceptions/data-validation.exception';
import { Results } from '../response/result-builder';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';

export interface ValidationErrorProperty {
  property: string;
  error: string;
}

export class ValidationPipeOptions extends ValidationPipe {
  override createExceptionFactory(): (
    validationErrors?: ValidationError[],
  ) => unknown {
    return (error: ValidationError[]) =>
      ValidationPipeOptions.createException(error);
  }

  static createException(error: ValidationError[]): any {
    const errors = error.map((e: ValidationError) => {
      return {
        value: e.value,
        property: e.property,
        error: e.constraints ? Object.values(e.constraints)[0] : '',
      };
    });
    return new DataValidationException(
      Results.validation(
        '検証エラー',
        ERRORS_DICTIONARY.VALIDATION_ERROR,
        null,
        errors,
      ),
    );
  }
}
