import mongoose from 'mongoose';
import { SUMMARY_CORE } from 'src/shared/enum';

export class CreateWordAnalysisDto {
  user?: mongoose.Types.ObjectId;
  core: SUMMARY_CORE;
}

export class UpdateWordAnalysisDto {
  characterCountDay?: number;
  characterCountMonth?: number;
  recenMonth?: string;
  recentDate?: string;
  summaryCore?: SUMMARY_CORE;
}
