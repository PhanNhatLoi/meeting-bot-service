import { BaseEntity } from 'src/base/entities/base-entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  JOINING_STATUS,
  PLATFORM,
  SUMMARY_CORE,
  TRANSLATE_STATUS,
} from 'src/shared/enum';
import { Translation } from './translation.entity';

export type MeetingDocument = HydratedDocument<Meeting>;

@Schema({
  collection: Meeting.name,
  timestamps: true,

  toJSON: {
    virtuals: true,
    transform: function (_doc, ret, _options) {
      ret.id = ret._id;
      ret.messagesInMeeting = JSON.parse(ret.messagesInMeeting || '[]');
      ret.chatWithAIAssistant = JSON.parse(ret.chatWithAIAssistant || '[]');
      delete ret.__v;
      delete ret.deletedAt;
      delete ret.createdAt;
      delete ret.createdBy;
      delete ret.updatedBy;
      delete ret.updatedAt;
      return ret;
    },
  },
})
export class Meeting extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAccount',
    required: true,
  })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ required: false, default: '-' })
  meetingCode: string;

  @Prop({ required: false, default: '' })
  title: string;

  @Prop({ required: false, default: '' })
  organizer: string;

  @Prop({
    required: false,
    default: JOINING_STATUS.NEW,
    enum: JOINING_STATUS,
  })
  joiningStatus: JOINING_STATUS;

  @Prop({ required: false, default: '' })
  recordUri: string;

  @Prop({ required: false, default: '[]' })
  messagesInMeeting: string;

  @Prop({ required: false, default: false })
  recording: boolean;
  @Prop({
    required: false,
    default: TRANSLATE_STATUS.NEW,
    enum: TRANSLATE_STATUS,
  })
  translateStatus: TRANSLATE_STATUS;

  @Prop({ required: false, default: '' })
  summary: string;

  @Prop({ required: false, default: null })
  summaryCore: SUMMARY_CORE | null;

  @Prop({ required: false, default: PLATFORM.undefined })
  platform: PLATFORM;

  @Prop({ required: false, default: '[]' })
  chatWithAIAssistant: string;

  translationAI: Translation[];
}
export const MeetingSchema = SchemaFactory.createForClass(Meeting);

MeetingSchema.virtual('translationAI', {
  ref: 'Translation',
  localField: '_id',
  foreignField: 'meeting',
});
