import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { TokenPayload } from '@modules/auth/interfaces/token.interface';
import { refresh_token_public_key } from 'src/shared/constants/jwt.constaint';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh_token',
) {
  constructor(private readonly _authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refresh_token_public_key,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    return await this._authService.getUserIfRefreshTokenMatched(
      payload.id,
      request.headers.authorization.split('Bearer ')[1],
    );
  }
}
