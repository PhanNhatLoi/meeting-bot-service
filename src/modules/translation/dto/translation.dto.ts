import mongoose from 'mongoose';

export class CreateTranslationDto {
  meeting?: mongoose.Types.ObjectId;
  speaker?: string;
  start?: number;
  end?: number;
  text?: string;
}
