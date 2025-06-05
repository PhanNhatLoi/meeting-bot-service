import { forwardRef, Module } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { HttpModule } from '@nestjs/axios';
import { QueueModule } from '@modules/queue/queue.module';
import { TranslationService } from '@modules/translation/translation.service';
import { AppConfigModule } from 'src/configs/config.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    AppConfigModule,
    HttpModule,
    forwardRef(() => QueueModule),
    BullModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService, TranslationService],
  exports: [MeetingService],
})
export class MeetingModule {}
