import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agenda } from 'agenda';
import { DatabaseConfig } from 'src/configs/config.interface';
import { MeetingCalendarDto } from './dto/meetingCarlendar.dto';
import { MeetingService } from '@modules/meeting/meeting.service';
import mongoose from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { NAME_QUEUE } from 'src/shared/bull.config';
import { Queue } from 'bullmq';
import { LANGUAGE_CODE, PLATFORM } from 'src/shared/enum';
import { convertToUTC } from 'src/shared/constants/global.constants';

@Injectable()
export class AgendaService implements OnModuleInit {
  private agenda: Agenda;
  private readonly logger = new Logger(AgendaService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(NAME_QUEUE.AUTO_JOIN_QUEUE)
    private readonly _autoJoinQueue: Queue,
    private readonly _meetingService: MeetingService,
  ) {
    const databaseConfig =
      this.configService.getOrThrow<DatabaseConfig>('database');
    this.agenda = new Agenda({
      db: {
        address: `${databaseConfig.uri}${databaseConfig.dbName}`,
        collection: 'wattingAutoJoin',
      },
    });
    this.agenda.define('autoJoin', async (job) => {
      const data: MeetingCalendarDto & { userId: string } = job?.attrs?.data;

      const hangoutLink = this.validateMeetingLink(data.hangoutLink);
      const meeting = await this._meetingService.create({
        user: new mongoose.Types.ObjectId(data.userId),
        recordUri: null,
        meetingCode: hangoutLink.meetingCode,
        recording: false,
        organizer: data.organizer?.email || '',
        title: data.summary || '',
        platform: hangoutLink.platform,
      });
      await this._autoJoinQueue.add(NAME_QUEUE.AUTO_JOIN_QUEUE, {
        languageCode: LANGUAGE_CODE.vi,
        meeting,
      });
    });
  }

  async onModuleInit() {
    await this.agenda.start();
    this.logger.log('✅ Agenda đã khởi chạy');
  }

  async scheduleMeetings(userId: string, events: MeetingCalendarDto[]) {
    for (const event of events) {
      await this.agenda.schedule(
        convertToUTC(event.start.dateTime, event.start.timeZone),
        'autoJoin',
        {
          userId,
          ...event,
        },
      );
    }
  }

  async cancelMeetings(params: {
    userId?: string;
    meetingCode?: string;
    eventId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query: any = {
      name: 'autoJoin',
    };

    // Thêm điều kiện theo userId
    if (params.userId) {
      query['data.userId'] = params.userId;
    }

    // Thêm điều kiện theo meetingCode
    if (params.meetingCode) {
      query['data.meetingCode'] = params.meetingCode;
    }

    // Thêm điều kiện theo eventId
    if (params.eventId) {
      query['data.id'] = params.eventId;
    }

    // Thêm điều kiện theo khoảng thời gian
    if (params.startDate || params.endDate) {
      query.nextRunAt = {};
      if (params.startDate) {
        query.nextRunAt.$gte = params.startDate;
      }
      if (params.endDate) {
        query.nextRunAt.$lte = params.endDate;
      }
    }

    try {
      // 1. Lấy danh sách agenda jobs
      const jobs = await this.agenda.jobs(query);
      const canceledCount = jobs.length;

      if (canceledCount === 0) {
        return {
          success: true,
          canceledCount: 0,
          message: 'Không có agenda jobs nào để hủy',
        };
      }

      // 2. Xóa agenda jobs (sẽ xóa trong MongoDB)
      for (const job of jobs) {
        await job.remove();
      }

      // 3. Cancel các job trong BullMQ queue
      const queueJobs = await this._autoJoinQueue.getJobs([
        'waiting',
        'active',
        'delayed',
      ]);
      let canceledQueueJobs = 0;

      for (const queueJob of queueJobs) {
        const jobData = queueJob.data;

        // Kiểm tra điều kiện để cancel job queue
        let shouldCancel = false;

        if (params.userId && jobData.meeting?.user === params.userId) {
          shouldCancel = true;
        }

        if (
          params.meetingCode &&
          jobData.meeting?.meetingCode === params.meetingCode
        ) {
          shouldCancel = true;
        }

        if (params.eventId && jobData.meeting?.eventId === params.eventId) {
          shouldCancel = true;
        }

        if (shouldCancel) {
          await queueJob.remove();
          canceledQueueJobs++;
        }
      }

      this.logger.log(
        `✅ Đã hủy ${canceledCount} agenda jobs và ${canceledQueueJobs} queue jobs`,
      );

      return {
        success: true,
        canceledCount,
        canceledQueueJobs,
        message: `Đã hủy ${canceledCount} agenda jobs và ${canceledQueueJobs} queue jobs`,
      };
    } catch (error) {
      this.logger.error('❌ Lỗi khi hủy agenda jobs:', error);
      return {
        success: false,
        canceledCount: 0,
        canceledQueueJobs: 0,
        message: 'Lỗi khi hủy agenda jobs',
        error: error.message,
      };
    }
  }

  // Hàm helper để hủy tất cả agenda của một user
  async cancelAllUserMeetings(userId: string) {
    return this.cancelMeetings({ userId });
  }

  // Hàm helper để hủy agenda theo meeting code
  async cancelMeetingByCode(meetingCode: string) {
    return this.cancelMeetings({ meetingCode });
  }

  // Hàm helper để hủy agenda theo event ID
  async cancelMeetingByEventId(eventId: string) {
    return this.cancelMeetings({ eventId });
  }

  // Hàm helper để hủy agenda trong khoảng thời gian
  async cancelMeetingsInDateRange(startDate: Date, endDate: Date) {
    return this.cancelMeetings({ startDate, endDate });
  }

  validateMeetingLink = (text: string) => {
    const googleMeetRegex =
      /^https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})(\?.+)?$/;

    const zoomRegex =
      /^https:\/\/([a-z0-9]+\.)?zoom\.us\/j\/(\d{9,11})(\?pwd=[A-Za-z0-9.\-]+)?$/;

    const teamsRegex =
      /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/([^\s?]+)(\?.+)?$/;

    const teamsLiveRegex =
      /^https:\/\/teams\.live\.com\/meet\/(\d+)(\?p=[A-Za-z0-9]+)?$/;

    // Check for Google Meet
    const googleMatch = text.match(googleMeetRegex);
    if (googleMatch) {
      return {
        validate: true,
        platform: PLATFORM.google,
        meetingCode: googleMatch[1],
        params: googleMatch[2]?.replace('?', '') || null,
      };
    }

    // Check for Zoom
    const zoomMatch = text.match(zoomRegex);
    if (zoomMatch) {
      return {
        validate: true,
        platform: PLATFORM.zoom,
        meetingCode: zoomMatch[2],
        params: zoomMatch[3]?.replace('?', '') || null,
      };
    }

    const teamsMatch = text.match(teamsRegex);
    if (teamsMatch) {
      return {
        validate: true,
        platform: PLATFORM.mst,
        meetingCode: teamsMatch[1],
        params: teamsMatch[2]?.replace('?', '') || null,
      };
    }

    const teamsLiveMatch = text.match(teamsLiveRegex);
    if (teamsLiveMatch) {
      return {
        validate: true,
        platform: PLATFORM.mst,
        meetingCode: teamsLiveMatch[1],
        params: teamsLiveMatch[2]?.replace('?', '') || null,
      };
    }

    return {
      validate: false,
      platform: null,
      meetingCode: null,
      params: null,
    };
  };
}
