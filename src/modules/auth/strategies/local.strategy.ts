import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserAccount } from '@database/entities/user-account.entity';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private _authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(username: string, password: string): Promise<UserAccount> {
    const user = await this._authService.getAuthenticatedUser(
      username,
      password,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
