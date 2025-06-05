import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from '@modules/gateways/events.module';
import { ConfigModule } from '@nestjs/config';
import { GoogleModule } from '@modules/google/google.module';
import { GLOBAL_CONFIG } from './configs/configuration.config';
import { ZoomModule } from '@modules/zoom/zoom.module';
import { UploadFileModule } from '@modules/file/upload-file.module';
import { BotModule } from '@modules/bot/bot.module';
import { DatabaseModule } from './database/db-context.module';
import { RepositoryModule } from './database/repository.modules';
import { MeetingModule } from '@modules/meeting/meeting.module';
import { SharedModule } from './shared/shared.module';
import { MsTeamModule } from '@modules/ms-team/ms-team.module';
import { UserAccountModule } from '@modules/user-account/user-account.modules';
import { SendmailModule } from '@modules/sendmail/sendmail.module';
import { OtpCodeModule } from '@modules/otp-code/otp-code.module';
import { AuthModule } from '@modules/auth/auth.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { AiModule } from '@modules/ai/ai.modules';
import { PaymentPackageModule } from '@modules/payment-package/payment-package.module';
import { WordAnalysisModule } from '@modules/word-analysis/word-analysis.modules';
import { TranslationModule } from '@modules/translation/translation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      expandVariables: true,
      load: [GLOBAL_CONFIG],
    }),
    SharedModule.forRoot({ isGlobal: true }),
    EventsModule.forRoot({ isGlobal: true }),
    RepositoryModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    GoogleModule,
    ZoomModule,
    MsTeamModule,
    UploadFileModule,
    BotModule,
    MeetingModule,
    UserAccountModule,
    SendmailModule,
    OtpCodeModule,
    AuthModule,
    PaymentModule,
    AiModule,
    PaymentPackageModule,
    WordAnalysisModule,
    TranslationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
