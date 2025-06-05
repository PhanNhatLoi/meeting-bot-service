import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { launch, getStream } from 'puppeteer-stream';
import { executablePath } from 'puppeteer';
import * as fs from 'fs';
import internal from 'stream';
import { Results } from 'src/base/response/result-builder';
import { GoogleService } from '@modules/google/google.service';
import { JOINING_STATUS, LANGUAGE_CODE, PLATFORM } from 'src/shared/enum';
import { MeetingService } from '@modules/meeting/meeting.service';
import { Result } from 'src/base/response/result';
import { Meeting } from 'src/database/entities/meeting.entity';
import mongoose from 'mongoose';
import { CreateMeetingDto } from '@modules/meeting/dto/create-meet.dto';
import { ZoomService } from '@modules/zoom/zoom.service';
import { MsTeamService } from '@modules/ms-team/ms-team.service';
import { IIdentityService } from 'src/shared/services/identity.service.interface';
import { Translation } from '@database/entities/translation.entity';
import { Browser, Page } from 'puppeteer-core';
import { AiService } from '@modules/ai/ai.service';
import { InjectQueue } from '@nestjs/bullmq';
import { NAME_QUEUE } from 'src/shared/bull.config';
import { Queue } from 'bullmq';
import { EventsGateway } from '@modules/gateways/events.gateway';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'test-12-a8809-7c320de1b94b.json';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private arrayClientValue: {
    [x: string]: {
      browser?: any;
      page?: any;
      stream?: internal.Transform;
      file?: fs.WriteStream;
      messages?: { sender: string; time: number; message: string }[];
      transcripts?: Translation[];
      listUsers?: string[];
      observer?: MutationObserver;
      timeStartRecord: number;
    };
  } = {};

  constructor(
    private readonly googleService: GoogleService,
    private readonly _meetingService: MeetingService,
    private readonly _zoomService: ZoomService,
    private readonly _msTeamService: MsTeamService,
    private readonly _identityService: IIdentityService,
    private readonly _aiService: AiService,
    private readonly _eventGateway: EventsGateway,
    @InjectQueue(NAME_QUEUE.AUTO_JOIN_QUEUE)
    private readonly _autoJoinQueue: Queue,
  ) {}

  async autoJoin(
    platform: PLATFORM,
    meetingCode: string,
    languageCode: LANGUAGE_CODE,
    params?: string,
  ): Promise<Result<Meeting>> {
    const meeting = await this._meetingService.create({
      user: new mongoose.Types.ObjectId(this._identityService.id),
      recordUri: null,
      meetingCode,
      recording: false,
      organizer: null,
      platform,
    });

    await this._autoJoinQueue.add(NAME_QUEUE.AUTO_JOIN_QUEUE, {
      languageCode,
      meeting,
      params,
    });
    return Results.success(meeting, `Join meeting: ${meetingCode} success`);
  }

  async joinAndRecord(data: {
    languageCode: LANGUAGE_CODE;
    meeting: Meeting;
    params: string;
  }) {
    const { meeting, languageCode, params } = data;
    const { platform, meetingCode } = meeting;

    try {
      await this._meetingService.updateMeeting(
        { _id: new mongoose.Types.ObjectId(meeting.id) },
        {
          joiningStatus: JOINING_STATUS.PROCESSING,
        },
      );

      const keyword = `${this._identityService.id}_${meeting.id}`;
      this.arrayClientValue[keyword] = {
        browser: null,
        stream: null,
        file: null,
        page: null,
        messages: [],
        transcripts: [],
        timeStartRecord: null,
      };

      const { browser, page } = await this.initBrowser(platform);

      this.arrayClientValue[keyword].browser = browser;
      this.arrayClientValue[keyword].page = page;

      const getAbsoluteTime = () => {
        return Date.now() - this.arrayClientValue[keyword].timeStartRecord;
      };

      const fileName = new Date().getTime() + '.webm';
      const file = fs.createWriteStream(`./files/${fileName}`);

      if (platform === PLATFORM.mst) {
        this.arrayClientValue[keyword].stream = await getStream(page as any, {
          audio: true,
          video: true,
          frameSize: 120, //fps
          streamConfig: { highWaterMarkMB: 25600 },
        });
      }

      let meetData;
      //get realtime chat
      switch (platform) {
        case PLATFORM.google:
          meetData = await this.googleService.autoJoin(
            page as any,
            meetingCode,
            meeting.id,
          );
          await this.googleService.handleWatchDom(
            page as any,
            getAbsoluteTime,
            meeting,
            (value) => {
              this.arrayClientValue[keyword].messages.push({
                ...value,
                time: getAbsoluteTime(),
              });
            },
            (value: string[]) => {
              this.arrayClientValue[keyword].listUsers = value;
            },
            this.arrayClientValue[keyword].observer,
            async () => {
              await this.handleStopBot(meeting.id);
            },
          );
          break;

        case PLATFORM.zoom:
          meetData = await this._zoomService.autoJoin(
            page as any,
            meetingCode,
            params,
            meeting.id,
          );
          await this._zoomService.handleWatchDom(
            page as any,
            getAbsoluteTime,
            meeting,
            (value) => {
              this.arrayClientValue[keyword].messages.push({
                ...value,
                time: getAbsoluteTime(),
              });
            },
            (value: string[]) => {
              this.arrayClientValue[keyword].listUsers = value;
            },
            this.arrayClientValue[keyword].observer,
            async () => {
              await this.handleStopBot(meeting.id);
            },
          );
          break;

        case PLATFORM.mst:
          meetData = await this._msTeamService.autoJoin(
            page as any,
            meetingCode,
            params,
            meeting.id,
          );
          await this._msTeamService.handleWatchDom(
            page as any,
            getAbsoluteTime,
            meeting,
            (value) => {
              this.arrayClientValue[keyword].messages.push({
                ...value,
                time: getAbsoluteTime(),
              });
            },
            (value: string[]) => {
              this.arrayClientValue[keyword].listUsers = value;
            },
            this.arrayClientValue[keyword].observer,
            async () => {
              await this.handleStopBot(meeting.id);
            },
          );
          break;

        default:
          break;
      }

      await this._meetingService.updateMeeting(
        { _id: new mongoose.Types.ObjectId(meeting.id) },
        {
          joiningStatus: JOINING_STATUS.DONE,
        },
      );

      this._eventGateway.handleJoiningMeeting(
        meeting.id,
        JOINING_STATUS.DONE,
        meetData.organizer,
      );

      if (
        meetData &&
        meetData?.participants &&
        meetData?.participants?.length
      ) {
        this.arrayClientValue[keyword].listUsers = meetData.participants;
      }
      if (this.arrayClientValue[keyword].stream) {
        this.arrayClientValue[keyword].stream.destroy();
      }
      this.arrayClientValue[keyword].stream = await getStream(page as any, {
        audio: true,
        video: true,
        frameSize: 120, //fps
        streamConfig: { highWaterMarkMB: 25600 },
      });
      this.arrayClientValue[keyword].stream.pipe(file);

      this.arrayClientValue[keyword].file = file;
      this.arrayClientValue[keyword].timeStartRecord = Date.now();

      this._aiService.speechToTextRealtime({
        timeStartRecord: this.arrayClientValue[keyword].timeStartRecord,
        languageCode,
        listUsers: this.arrayClientValue[keyword].listUsers,
        meeting,
        setTranscript: (val: Translation) => {
          this.arrayClientValue[keyword].transcripts.push(val);
        },
        stream: this.arrayClientValue[keyword].stream,
      });

      const result = await this._meetingService.updateMeeting(
        { _id: new mongoose.Types.ObjectId(meeting.id) },
        {
          recording: true,
          recordUri: fileName,
          organizer: meetData?.organizer || '',
        },
      );

      // Change response to socket
      return Results.success(
        result.response,
        `Join meeting: ${meetingCode} success`,
      );
    } catch (error) {
      console.log(error);
      await this.handleKillBrowser({
        id: meeting.id,
        payload: { recording: false },
      });
      throw new BadRequestException(error);
    }
  }

  async testNoti(data: {
    languageCode: LANGUAGE_CODE;
    meeting: Meeting;
    params: string;
  }) {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    this._eventGateway.handleJoiningMeeting(
      data.meeting.id,
      JOINING_STATUS.PROCESSING,
    );
    await new Promise((resolve) => setTimeout(resolve, 4000));

    this._eventGateway.handleJoiningMeeting(
      data.meeting.id,
      JOINING_STATUS.WATING_FOR_ADMIT,
    );

    await new Promise((resolve) => setTimeout(resolve, 4000));

    this._eventGateway.handleJoiningMeeting(
      data.meeting.id,
      JOINING_STATUS.DONE,
    );
  }

  async handleStopBot(meetingId: string) {
    try {
      const meeting = await this._meetingService.getMeeting({
        _id: new mongoose.Types.ObjectId(meetingId),
      });
      if (meeting) {
        //todo trans speech
        if (
          this.arrayClientValue[`${this._identityService.id}_${meeting.id}`]
        ) {
          await this.handleKillBrowser({
            id: meeting.id,
            payload: {
              recording: false,
              messagesInMeeting: JSON.stringify(
                this.arrayClientValue[
                  `${this._identityService.id}_${meeting.id}`
                ].messages,
              ),
              // save into database
              transcripts:
                this.arrayClientValue[
                  `${this._identityService.id}_${meeting.id}`
                ].transcripts,
            },
          });
        }
      }
      return Results.success(true);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  async handleKillBrowser(meetingData?: {
    id: string;
    payload: CreateMeetingDto;
  }) {
    try {
      if (
        this.arrayClientValue[`${this._identityService.id}_${meetingData.id}`]
      ) {
        this.arrayClientValue[
          `${this._identityService.id}_${meetingData.id}`
        ].browser?.close();
        this.arrayClientValue[
          `${this._identityService.id}_${meetingData.id}`
        ].stream?.destroy();
        this.arrayClientValue[
          `${this._identityService.id}_${meetingData.id}`
        ].file?.close();
        this.arrayClientValue[
          `${this._identityService.id}_${meetingData.id}`
        ].observer?.disconnect();
        delete this.arrayClientValue[
          `${this._identityService.id}_${meetingData.id}`
        ];
      }
      if (meetingData) {
        const meeting = await this._meetingService.getMeeting({
          _id: new mongoose.Types.ObjectId(meetingData.id),
          recording: true,
        });
        if (meeting) {
          await this._meetingService.updateMeeting(
            { _id: new mongoose.Types.ObjectId(meetingData.id) },
            meetingData.payload,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in handleKillBrowser:', error);
    }
  }

  async handleGetInfo(
    meetingId: string,
  ): Promise<Result<{ recording: boolean; chatMessages: any[] }>> {
    const meeting = await this._meetingService.getMeeting({
      _id: new mongoose.Types.ObjectId(meetingId),
      user: this._identityService.id,
    });
    const meetCurrent =
      this.arrayClientValue[`${this._identityService.id}_${meetingId}`];
    if (meeting.recording && !meetCurrent) {
      await this.handleKillBrowser({
        id: meeting.id,
        payload: { recording: false },
      });

      return Results.success({ recording: false, chatMessages: [] });
    }

    return Results.success({
      recording: !!meetCurrent,
      chatMessages: meetCurrent?.messages || [],
      transcripts: meetCurrent?.transcripts || [],
      meetingDetail: meeting,
    });
  }

  async initBrowser(platform: PLATFORM): Promise<{
    browser: Browser;
    page: Page;
  }> {
    const googleOps = {
      headless: undefined,
      allowIncognito: true,
      args: [
        '--incognito',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--start-maximized',
        '--window-size=1920,1080',
      ],
    };

    const browser: any = await launch({
      headless: 'new',
      executablePath: executablePath(),
      defaultViewport: null,
      ...(platform === PLATFORM.google
        ? googleOps
        : {
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-blink-features=AutomationControlled',
              '--disable-infobars',
              '--start-maximized',
              '--window-size=1920,1080',
            ],
          }),
    });

    await browser.newPage();
    const [page, _, configExtension] = await browser.pages();

    if (platform === PLATFORM.google) {
      await configExtension.goto('chrome://extensions/');

      //allow extension for incognito
      await configExtension.evaluate(`
        chrome.developerPrivate.getExtensionsInfo().then((extensions) => {
          extensions.map((extension) => chrome.developerPrivate.updateExtensionConfiguration({extensionId: extension.id, incognitoAccess: true}));
        });
      `);
    }

    await page.evaluateOnNewDocument(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new Error('Access to microphone and camera is blocked');
      };
    });

    return {
      browser,
      page,
    };
  }
}
