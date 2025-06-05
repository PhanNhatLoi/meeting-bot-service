import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthController } from './auth.controller';
import { OtpCodeService } from '@modules/otp-code/services/otp-code.service';
import { SendmailService } from '@modules/sendmail/sendmail.service';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
import { JwtAccessTokenStrategy } from './strategies/jwt-access-token.strategy';
import { GoogleService } from '@modules/google/google.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GLOBAL_CONFIG } from 'src/configs/configuration.config';
import { JwtAccessTokenGuard } from './guards/jwt-access-token.guard';
import { WordAnalysisService } from '@modules/word-analysis/word-analysis.service';
import { PaymentService } from '@modules/payment/payment.service';
import { GoogleModule } from '@modules/google/google.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      expandVariables: true,
      load: [GLOBAL_CONFIG],
    }),
    HttpModule,
    GoogleModule,
  ],
  providers: [
    AuthService,
    OtpCodeService,
    SendmailService,
    LocalStrategy,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
    PaymentService,
    {
      provide: 'APP_GUARD',
      useClass: JwtAccessTokenGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
