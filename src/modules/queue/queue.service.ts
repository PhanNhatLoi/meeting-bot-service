import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NAME_QUEUE } from 'src/shared/bull.config';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(NAME_QUEUE.SPEECH_TO_TEXT) private readonly queue: Queue,
  ) {}

  async addJob(data: any) {
    await this.queue.add(NAME_QUEUE.SPEECH_TO_TEXT, data, {
      attempts: 3, // Số lần retry khi thất bại
      backoff: 5000, // Thời gian chờ giữa các lần retry (ms)
    });
    console.log('Job added to queue:', data);
  }
}
