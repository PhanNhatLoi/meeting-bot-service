import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '@modules/auth/interfaces/token.interface';
import { access_token_public_key } from 'src/shared/constants/jwt.constaint';
import { Types } from 'mongoose';
import { UserAccountService } from '@modules/user-account/services/user-account.service';
import { IIdentityService } from 'src/shared/services/identity.service.interface';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly _userService: UserAccountService,
    private readonly _identityService: IIdentityService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: access_token_public_key,
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this._userService.get({
      _id: new Types.ObjectId(payload.id),
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    this._identityService.setUser(user);
    return user;
  }
}
