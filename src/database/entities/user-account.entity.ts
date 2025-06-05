import { BaseEntity } from 'src/base/entities/base-entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude } from 'class-transformer';
import { UserSubcription } from './user-subcription.entity';

export type UserDocument = HydratedDocument<UserAccount>;

@Schema({
  collection: UserAccount.name,
  timestamps: true,

  toJSON: {
    virtuals: true,
    transform: function (_doc, ret, _options) {
      ret.id = ret._id;
      ret.subcription = ret.subcription || null;
      delete ret.__v;
      delete ret.accessKey;
      delete ret.password;
      delete ret.deletedAt;
      delete ret.createdAt;
      delete ret.createdBy;
      delete ret.updatedBy;
      delete ret.updatedAt;
      return ret;
    },
  },
})
export class UserAccount extends BaseEntity {
  @Prop({
    required: true,
    minlength: 2,
    maxlength: 100,
    set: (name: string) => {
      return name.trim();
    },
  })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, default: '' })
  avatar: string;

  @Exclude()
  @Prop({ required: false })
  password: string;

  @Prop({ required: false, default: false })
  emailVerified: boolean;

  @Prop({ required: false, default: '' })
  accessKey: string;
  userSubcriptions: UserSubcription[];

  subcription: object;

  @Prop({ required: false, default: '' })
  googleAccessToken: string;

  @Prop({ required: false, default: '' })
  googleRefreshToken: string;

  @Prop({ required: false, default: false })
  registerGoogleCalendar: boolean;
}
export const UserSchema = SchemaFactory.createForClass(UserAccount);

UserSchema.virtual('userSubcriptions', {
  ref: 'UserSubcription',
  localField: '_id',
  foreignField: 'user',
});
