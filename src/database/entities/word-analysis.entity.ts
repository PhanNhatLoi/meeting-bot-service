import { BaseEntity } from 'src/base/entities/base-entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { SUMMARY_CORE } from 'src/shared/enum';

export type WordAnalysisDocument = HydratedDocument<WordAnalysis>;

@Schema({
  collection: WordAnalysis.name,
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
export class WordAnalysis extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAccount',
    required: true,
  })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({
    required: false,
    default: 0,
  })
  characterCountDay: number;

  @Prop({
    required: false,
    default: 0,
  })
  characterCountMonth: number;

  @Prop({
    required: false,
    default: null,
  })
  recentDate: string;

  @Prop({
    required: false,
    default: null,
  })
  recentMonth: string;

  @Prop({ required: true })
  core: SUMMARY_CORE;
}
export const WordAnalysisSchema = SchemaFactory.createForClass(WordAnalysis);
