import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GLOBAL_CONFIG } from 'src/configs/configuration.config';
import { AiService } from '@modules/ai/ai.service';
import { MeetingService } from '@modules/meeting/meeting.service';
import { AiController } from './ai.controller';
import { SpeechToTextProcessor } from '@modules/queue/speech-to-text.processor';
import { WordAnalysisService } from '@modules/word-analysis/word-analysis.service';
import { HttpModule } from '@nestjs/axios';
import { TranslationService } from '@modules/translation/translation.service';
import { QueueModule } from '@modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      expandVariables: true,
      load: [GLOBAL_CONFIG],
    }),
    HttpModule,
    forwardRef(() => QueueModule),
  ],
  providers: [
    AiService,
    MeetingService,
    WordAnalysisService,
    TranslationService,
    SpeechToTextProcessor,
  ],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
