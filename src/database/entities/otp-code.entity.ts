import { BaseEntity } from 'src/base/entities/base-entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { otpTime } from '@modules/otp-code/services/otp-code.service';

export type OtpCodeDocument = HydratedDocument<OtpCode>;

@Schema({
  collection: OtpCode.name,
  timestamps: true,
  toJSON: {
    transform: function (_doc, ret, _options) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class OtpCode extends BaseEntity {
  @Prop({
    required: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  otpCode: string;

  @Prop({
    required: true,
  })
  expiresAt: Date;

  @Prop({
    nullable: true,
    default: otpTime,
  })
  otpTime: number;
}

export const OtpCodeSchema = SchemaFactory.createForClass(OtpCode);
