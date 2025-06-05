import { Meeting } from '@database/entities/meeting.entity';
import { BotService } from '@modules/bot/bot.service.ts';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NAME_QUEUE } from 'src/shared/bull.config';
import { LANGUAGE_CODE } from 'src/shared/enum';

@Processor(NAME_QUEUE.AUTO_JOIN_QUEUE)
export class AutoJoinProcessor extends WorkerHost {
  constructor(private readonly _botService: BotService) {
    super();
  }
  async process(
    job: Job<{
      languageCode: LANGUAGE_CODE;
      meeting: Meeting;
      params: string;
    }>,
  ): Promise<void> {
    const { meeting } = job.data;
    console.log(
      `Processing auto join job for meeting code: ${meeting.meetingCode}`,
    );
    await this._botService.joinAndRecord(job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} completed successfully!`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} failed:`, error.message);
  }
}
