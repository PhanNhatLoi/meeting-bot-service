import { Module, DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModuleOptions } from '@nestjs/config';
import { UserAccountRepository } from './repositories/user-account.repository';
import { UserAccount, UserSchema } from './entities/user-account.entity';
import { MeetingRepository } from './repositories/meeting.repository';
import { Meeting, MeetingSchema } from './entities/meeting.entity';
import { OtpCodeRepository } from './repositories/otp-code.repository';
import { OtpCode, OtpCodeSchema } from './entities/otp-code.entity';
import { UserSubcriptionRepository } from './repositories/user-subcription.repository';
import {
  UserSubcription,
  UserSubcriptionSchema,
} from './entities/user-subcription.entity';
import { WordAnalysisRepository } from './repositories/word-analysis.repository';
import {
  WordAnalysis,
  WordAnalysisSchema,
} from './entities/word-analysis.entity';
import { TranslationRepository } from './repositories/translation.repository';
import { Translation, TranslationSchema } from './entities/translation.entity';

@Module({})
export class RepositoryModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule {
    const providers = [
      {
        provide: 'IUserAccountRepository',
        useClass: UserAccountRepository,
      },

      {
        provide: 'IMeetingRepository',
        useClass: MeetingRepository,
      },

      {
        provide: 'IOtpCodeRepository',
        useClass: OtpCodeRepository,
      },

      {
        provide: 'IUserSubcriptionRepository',
        useClass: UserSubcriptionRepository,
      },

      {
        provide: 'IWordAnalysisRepository',
        useClass: WordAnalysisRepository,
      },
      {
        provide: 'ITranslationRepository',
        useClass: TranslationRepository,
      },
    ];

    return {
      global: options.isGlobal,
      module: RepositoryModule,
      imports: [
        MongooseModule.forFeature([
          { name: UserAccount.name, schema: UserSchema },
          { name: Meeting.name, schema: MeetingSchema },
          { name: OtpCode.name, schema: OtpCodeSchema },
          { name: UserSubcription.name, schema: UserSubcriptionSchema },
          { name: WordAnalysis.name, schema: WordAnalysisSchema },
          { name: Translation.name, schema: TranslationSchema },
        ]),
      ],
      providers: providers,
      exports: providers,
    };
  }
}
