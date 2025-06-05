import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IMeetingRepository } from 'src/database/interfaces/meeting.repository.interface';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/create-meet.dto';
import { Results } from 'src/base/response/result-builder';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';
import { Meeting } from 'src/database/entities/meeting.entity';
import mongoose, { FilterQuery } from 'mongoose';
import { FilterMeetDto } from './dto/filter-meet.dto';
import { Result } from 'src/base/response/result';
import { PaginationResult } from 'src/base/response/pagination.result';
import { IIdentityService } from 'src/shared/services/identity.service.interface';
import { UploadFileService } from '@modules/file/services/upload-file.service';
import { TranslationService } from '@modules/translation/translation.service';
import { Translation } from '@database/entities/translation.entity';
import {
  JOINING_STATUS,
  SUMMARY_CORE,
  TRANSLATE_STATUS,
} from 'src/shared/enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NAME_QUEUE } from 'src/shared/bull.config';

@Injectable()
export class MeetingService {
  constructor(
    @Inject('IMeetingRepository')
    private readonly _meetingRepository: IMeetingRepository,
    private readonly _identityService: IIdentityService,
    private readonly _fileService: UploadFileService,
    private readonly _translationService: TranslationService,
    @InjectQueue(NAME_QUEUE.SPEECH_TO_TEXT)
    private readonly speechToTextQueue: Queue,
  ) {}

  async create(payload: CreateMeetingDto): Promise<Meeting> {
    try {
      return await this._meetingRepository.create({
        createdDate: new Date(),
        ...payload,
      });
    } catch (error) {
      throw error;
    }
  }

  async getMeeting(condition: FilterQuery<Meeting>) {
    const meeting = await this._meetingRepository.findOneByCondition(
      condition,
      [
        {
          path: 'translationAI',
          // select: ['isActive', 'startDate', 'endDate', 'deletedAt', 'user'],
          match: { deletedAt: null },
        },
      ],
    );
    if (!meeting) {
      throw new BadRequestException(
        Results.badRequest(
          'Meeting not found',
          ERRORS_DICTIONARY.VALIDATION_ERROR,
        ),
      );
    }
    return meeting;
  }

  async getPagination(
    filter: FilterMeetDto,
  ): Promise<Result<PaginationResult<Meeting>>> {
    const { limit, page, orderBy, ...rest } = filter;

    let conditions = {
      deletedAt: null,
      user: this._identityService._id,
    } as FilterQuery<Meeting>;

    const result = await this._meetingRepository.getPagination(conditions, {
      limit,
      page,
      orderBy,
    });
    return Results.success(result, 'Get records success');
  }
  async handleGetInfo(meetingId: string): Promise<Result<Meeting>> {
    const meeting = await this.getMeeting({
      user: this._identityService._id,
      _id: new mongoose.Types.ObjectId(meetingId),
      deletedAt: null,
    });
    return Results.success(meeting);
  }

  async updateMeeting(
    conditions: FilterQuery<Meeting>,
    payload: UpdateMeetingDto,
  ): Promise<Result<Meeting>> {
    const meet = await this.getMeeting(conditions);
    if (payload.transcripts) {
      await this._translationService.replaceTranslation(
        new mongoose.Types.ObjectId(meet.id),
        payload.transcripts,
      );
      payload.translateStatus = TRANSLATE_STATUS.DONE;
      delete payload.transcripts;
    }
    return Results.success(
      await this._meetingRepository.findOneAndUpdate(conditions, {
        ...(payload as any),
        messages:
          (payload?.messagesInMeeting &&
            JSON.stringify(payload.messagesInMeeting)) ||
          undefined,
      }),
    );
  }

  async importMeeting(
    file: Express.Multer.File,
    language: string,
  ): Promise<Result<Meeting>> {
    try {
      const filePath = await this._fileService.uploadFile(file);
      const meeting = await this.create({
        user: new mongoose.Types.ObjectId(this._identityService.id),
        organizer: null,
        recordUri: filePath.filename,
        messagesInMeeting: '[]',
        recording: false,
        joiningStatus: JOINING_STATUS.IMPORT,
      });
      // todo using queue
      const summary = SUMMARY_CORE.ALIBABA;
      await this.speechToTextQueue.add('speech-to-text', {
        meetingId: meeting.id,
        summary,
        language,
      });
      // todo using queue

      return Results.success(meeting);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        Results.badRequest(
          'Import meet error',
          ERRORS_DICTIONARY.ERROR_INTERNAL_SERVER,
        ),
      );
    }
  }

  async deleteMeeting(meetingId: string): Promise<Result<boolean>> {
    try {
      await this.getMeeting({
        _id: new mongoose.Types.ObjectId(meetingId),
        user: this._identityService._id,
        deletedAt: null,
      });
      await this._meetingRepository.softDelete(meetingId);
      return Results.success(true);
    } catch (error) {
      throw error;
    }
  }

  async handleUpdateTranslation(
    meetingId: string,
    translationId: string,
    payload: Partial<Translation>,
  ): Promise<Result<Meeting>> {
    try {
      const res = await this._translationService.updateTranslation(
        {
          _id: new mongoose.Types.ObjectId(translationId),
          meeting: new mongoose.Types.ObjectId(meetingId),
        },
        payload,
      );
      if (!res) {
        throw new NotFoundException(
          Results.notFound(
            'translation not found',
            ERRORS_DICTIONARY.NOT_FOUND,
          ),
        );
      }
      return Results.success(
        await this.getMeeting({ _id: new mongoose.Types.ObjectId(meetingId) }),
      );
    } catch (error) {
      throw error;
    }
  }
}
