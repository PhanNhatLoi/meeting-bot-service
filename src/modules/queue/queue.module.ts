import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SpeechToTextProcessor } from './speech-to-text.processor';
import { AutoJoinProcessor } from './auto-join.processor';
import { NAME_QUEUE } from 'src/shared/bull.config';
import { AiModule } from '@modules/ai/ai.modules';
import { BotModule } from '@modules/bot/bot.module';
import { AgendaService } from './agenda.service';
import { MeetingModule } from '@modules/meeting/meeting.module';
import { GoogleModule } from '@modules/google/google.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.DOCKER_HOST,
        port: Number(process.env.DOCKER_PORT),
      },
    }),
    BullModule.registerQueue(
      { name: NAME_QUEUE.SPEECH_TO_TEXT },
      { name: NAME_QUEUE.AUTO_JOIN_QUEUE },
    ),
    AiModule,
    forwardRef(() => MeetingModule),
    forwardRef(() => GoogleModule),
    forwardRef(() => BotModule),
  ],
  providers: [SpeechToTextProcessor, AutoJoinProcessor, AgendaService],
  exports: [BullModule, AgendaService],
})
export class QueueModule {}
