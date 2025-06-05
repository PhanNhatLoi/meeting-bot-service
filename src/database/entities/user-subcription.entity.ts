import { BaseEntity } from 'src/base/entities/base-entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserSubcriptionDocument = HydratedDocument<UserSubcription>;

@Schema({
  collection: UserSubcription.name,
  timestamps: true,
  toJSON: {
    transform: function (_doc, ret, _options) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
})
export class UserSubcription extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAccount',
    required: true,
  })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({
    required: true,
  })
  stripe_product_id: string;
}

export const UserSubcriptionSchema =
  SchemaFactory.createForClass(UserSubcription);
