import { AuthGuard } from '@nestjs/passport';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest<Request>();

    // Lấy userId từ query params
    const systemEmail = request.query.systemEmail as string;
    if (systemEmail) {
      request.session = request.session || {};
      request.session.systemEmail = systemEmail;
    }

    return super.canActivate(context) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const systemEmail = request.query.systemEmail as string;

    return {
      state: JSON.stringify({ systemEmail }),
    };
  }
}
