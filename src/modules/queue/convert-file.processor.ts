import { AiService } from '@modules/ai/ai.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NAME_QUEUE } from 'src/shared/bull.config';
import { TRANSLATE_STATUS } from 'src/shared/enum';
import mongoose from 'mongoose';

@Processor(NAME_QUEUE.CONVERT_FILE)
export class ConvertFileProcessor extends WorkerHost {
  constructor(private readonly aiService: AiService) {
    super();
  }

  async process(
    job: Job<{
      meetingId: string;
      recordUri: string;
    }>,
  ): Promise<void> {
    const { meetingId, recordUri } = job.data;
    console.log(`Processing convert file job for meeting ID: ${meetingId}`);

    try {
      const newMp4FilePath =
        await this.aiService.convertWebmToMp4IfNeeded(recordUri);

      if (newMp4FilePath) {
        // Update meeting with new mp4 file path
        await this.aiService.updateAndSentEvent(
          new mongoose.Types.ObjectId(meetingId),
          {
            status: TRANSLATE_STATUS.DONE,
            recordUri: newMp4FilePath,
          },
        );
        console.log(`File converted successfully for meeting: ${meetingId}`);
      } else {
        console.log(`No conversion needed for meeting: ${meetingId}`);
      }
    } catch (error) {
      console.error(`Error converting file for meeting ${meetingId}:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Convert file job ${job.id} completed successfully!`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Convert file job ${job.id} failed:`, error.message);
  }
}
