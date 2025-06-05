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
    await this.agenda.cancel({ 'data.userId': userId });

    for (const event of events) {
      await this.agenda.schedule(
        convertToUTC(event.start.dateTime, event.start.timeZone),
        // new Date(Date.now()).toUTCString(),
        'autoJoin',
        {
          userId,
          ...event,
        },
      );
    }
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
