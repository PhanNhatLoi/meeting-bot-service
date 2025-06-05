import { Translation } from '@database/entities/translation.entity';
import { IsEmpty, IsOptional } from 'class-validator';
import mongoose from 'mongoose';
import {
  JOINING_STATUS,
  PLATFORM,
  SUMMARY_CORE,
  TRANSLATE_STATUS,
} from 'src/shared/enum';

export class CreateMeetingDto {
  title?: string;
  meetingCode?: string;
  user?: mongoose.Types.ObjectId;
  recordUri?: string;
  messagesInMeeting?: string;
  recording?: boolean;
  organizer?: string;
  summary?: string;
  platform?: PLATFORM;
  chatWithAIAssistant?: string;
  transcripts?: Translation[];
  joiningStatus?: JOINING_STATUS;
}

export class UpdateMeetingDto {
  @IsOptional()
  meetingCode?: string;
  @IsOptional()
  title?: string;
  @IsOptional()
  recordUri?: string;
  @IsOptional()
  messagesInMeeting?: string;
  @IsOptional()
  transcripts?: Translation[];
  @IsOptional()
  recording?: boolean;
  @IsOptional()
  translateStatus?: TRANSLATE_STATUS;
  @IsOptional()
  joiningStatus?: JOINING_STATUS;
  @IsOptional()
  organizer?: string;
  @IsOptional()
  summary?: string;
  @IsOptional()
  summaryCore?: SUMMARY_CORE;
  @IsOptional()
  chatWithAIAssistant?: string;
  @IsOptional()
  platform?: PLATFORM;
  @IsEmpty()
  user?;
  @IsEmpty()
  deletedAt?;
}
