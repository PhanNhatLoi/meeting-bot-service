import { forwardRef, Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { GoogleService } from '@modules/google/google.service';
import { ZoomService } from '@modules/zoom/zoom.service';
import { MsTeamService } from '@modules/ms-team/ms-team.service';
import { QueueModule } from '@modules/queue/queue.module';
import { BotService } from './bot.service.ts';
import { MeetingModule } from '@modules/meeting/meeting.module';
import { AiModule } from '@modules/ai/ai.modules';
import { HttpModule } from '@nestjs/axios';
import { GoogleModule } from '@modules/google/google.module';

@Module({
  imports: [
    forwardRef(() => MeetingModule),
    forwardRef(() => QueueModule),
    forwardRef(() => GoogleModule), // 👈 Dùng forwardRef nếu có vòng lặp
    forwardRef(() => AiModule),
    HttpModule,
  ],
  controllers: [BotController],
  providers: [BotService, GoogleService, ZoomService, MsTeamService],
  exports: [BotService],
})
export class BotModule {}
