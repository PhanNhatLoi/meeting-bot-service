import { BaseEntity } from 'src/base/entities/base-entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TranslationDocument = HydratedDocument<Translation>;

@Schema({
  collection: Translation.name,
  timestamps: true,

  toJSON: {
    transform: function (_doc, ret, _options) {
      ret.id = ret._id;
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
export class Translation extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
  })
  meeting: mongoose.Schema.Types.ObjectId;

  @Prop({ required: false, default: false })
  bookmark?: boolean;

  @Prop({ required: false, default: '' })
  tag?: string;

  @Prop({ type: [String], required: false, default: [] })
  highlights?: string[];

  @Prop({ required: false, default: null })
  speaker: string;

  @Prop({ required: false, default: 0 })
  start: number;

  @Prop({ required: false, default: 0 })
  end: number;

  @Prop({ required: false, default: '' })
  time: string;

  @Prop({ required: false, default: false })
  newWords: boolean;

  @Prop({ required: false, default: '' })
  transcript: string;
}
export const TranslationSchema = SchemaFactory.createForClass(Translation);
