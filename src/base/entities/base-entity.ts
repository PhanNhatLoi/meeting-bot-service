import { Prop } from '@nestjs/mongoose';
import { Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongoose';
export class BaseEntity {
  _id?: ObjectId | string;

  @Expose()
  @Transform((value) => value.obj?._id?.toString(), { toClassOnly: true })
  id?: string;

  @Prop({ default: null, required: false })
  deletedAt?: Date;

  @Prop({
    default: null,
    required: false,
  })
  createdBy?: string;

  @Prop({
    default: null,
    required: false,
  })
  updatedBy?: string;

  updatedAt?: Date;
  createdAt?: Date;

  @Prop({
    default: true,
    required: false,
  })
  isActive?: boolean;
}
