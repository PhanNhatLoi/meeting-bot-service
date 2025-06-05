export enum ResponseType {
  Success = 200,
  Created = 201,
  NotFound = 404,
  Validation = 400,
  Unauthorized = 401,
  Forbidden = 403,
  Conflict = 409,
  Gone = 410,
  BadRequest = 400,
  InternalServer = 500,
}

export class CoreMutationOutput {
  message: string;
  success: boolean;
}

export class CoreErrorOutput {
  value: any;
  property: string;
  error: string;
}
