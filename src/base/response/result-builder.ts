import { CoreErrorOutput, ResponseType } from 'src/base/response/response-type';
import { Result } from 'src/base/response/result';

export class Results {
  static success<TResponse>(data: TResponse, message: string | null = null) {
    return new Result<TResponse>(data, message, ResponseType.Success);
  }
  static created<TResponse>(data: TResponse, message: string | null = null) {
    return new Result<TResponse>(data, message, ResponseType.Created);
  }
  static notFound<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.NotFound,
      errorCode || message,
      errors || [],
    );
  }
  static validation<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.Validation,
      errorCode || message,
      errors || [],
    );
  }
  static unauthorized<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.Unauthorized,
      errorCode || message,
      errors || [],
    );
  }
  static forbidden<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.Forbidden,
      errorCode || message,
      errors || [],
    );
  }
  static badRequest<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.BadRequest,
      errorCode || message,
      errors || [],
    );
  }
  static internalServer<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.InternalServer,
      errorCode || message,
      errors || [],
    );
  }
  static alreadyExist<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.Conflict,
      errorCode || message,
      errors || [],
    );
  }
  static error<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    statusCode = ResponseType.InternalServer,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      statusCode,
      errorCode || message,
      errors || [],
    );
  }
  static goneException<TResponse>(
    message: string | null = null,
    errorCode: string | null = null,
    data: TResponse | null = null,
    errors?: CoreErrorOutput[],
  ) {
    return new Result<any>(
      data,
      message,
      ResponseType.Gone,
      errorCode || message,
      errors || [],
    );
  }
}
