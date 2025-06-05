import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleService } from '../google.service';

@Injectable()
export class GoogleAuthGuardLocal implements CanActivate {
  constructor(private readonly googleAuthService: GoogleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    const user = await this.googleAuthService.verifyGoogleAccessToken(token);
    request.user = user;
    return true;
  }
}
