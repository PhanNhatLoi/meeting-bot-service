import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<any>('google').clientId,
      clientSecret: configService.getOrThrow<any>('google').clientSecret,
      callbackURL: configService.getOrThrow<any>('google').redirectUri,
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
      passReqToCallback: true, // Cần để lấy request khi Google gọi lại
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    // Lấy userId từ state
    const state = request.query.state
      ? JSON.parse(decodeURIComponent(request.query.state))
      : null;

    return {
      accessToken,
      refreshToken,
      profile,
      systemEmail: state?.systemEmail,
    };
  }
}
