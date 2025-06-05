import { AiService } from '@modules/ai/ai.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NAME_QUEUE } from 'src/shared/bull.config';
import { SUMMARY_CORE } from 'src/shared/enum';

@Processor(NAME_QUEUE.SPEECH_TO_TEXT)
export class SpeechToTextProcessor extends WorkerHost {
  constructor(private readonly aiService: AiService) {
    super();
  }
  async process(
    job: Job<{
      meetingId: string;
      summaryCore: SUMMARY_CORE;
      language: string;
      getSummaryText?: boolean;
    }>,
  ): Promise<void> {
    const { meetingId, summaryCore, language, getSummaryText } = job.data;
    console.log(`Processing translation job for meeting ID: ${meetingId}`);
    await this.aiService.processTranslationJob(
      meetingId,
      summaryCore,
      language,
      getSummaryText,
    );
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
