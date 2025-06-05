import { CoreErrorOutput } from './response-type';

export class Result<TResponse> {
  success = true;

  constructor(
    readonly response: TResponse,
    readonly message: string | null,
    readonly status: number,
    readonly errorCode?: string | null,
    readonly errors?: CoreErrorOutput[],
  ) {
    if (errorCode) this.success = false;
  }
}
