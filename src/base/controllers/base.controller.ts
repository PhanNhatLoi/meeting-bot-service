import { ResponseType } from 'src/base/response/response-type';
import { Result } from 'src/base/response/result';
import { Response } from 'express';
import { Results } from 'src/base/response/result-builder';

export abstract class BaseController {
  response(res: Response, data: Result<any> | null) {
    let responseMethod = undefined;
    switch (data?.status) {
      case ResponseType.Success:
        responseMethod = this.ok;
        break;
      case ResponseType.NotFound:
        responseMethod = this.notFound;
        break;
      case ResponseType.Validation:
        responseMethod = this.badRequest;
        break;
      case ResponseType.Unauthorized:
        responseMethod = this.unauthorized;
        break;
      case ResponseType.Forbidden:
        responseMethod = this.forbidden;
        break;
      case ResponseType.BadRequest:
        responseMethod = this.badRequest;
        break;
      default:
        responseMethod = this.internalServer;
    }
    return responseMethod(res, data ?? Results.notFound('Not found resource'));
  }

  private ok(res: Response, data: Result<any>) {
    return res.status(data.status).json(data);
  }

  private badRequest(res: Response, data: Result<any>) {
    return res.status(data.status).json(data);
  }

  private notFound(res: Response, data: Result<any>) {
    return res.status(data.status).json(data);
  }

  private forbidden(res: Response, data: Result<any>) {
    return res.status(data.status).json(data);
  }

  private unauthorized(res: Response, data: Result<any>) {
    return res.status(data.status).json(data);
  }

  private internalServer(res: Response, data: Result<any>) {
    return res.status(data.status).json(data);
  }
}
