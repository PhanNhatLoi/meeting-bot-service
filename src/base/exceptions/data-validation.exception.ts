import { BadRequestException, HttpExceptionOptions } from '@nestjs/common';

export class DataValidationException extends BadRequestException {
  constructor(
    objectOrError?: string | object | any,
    descriptionOrOptions?: string | HttpExceptionOptions,
  ) {
    super(objectOrError ?? '検証エラー', descriptionOrOptions);
  }
}
