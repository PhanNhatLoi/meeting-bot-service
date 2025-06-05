import { IsEnum, IsString } from 'class-validator';
import { SUMMARY_CORE } from 'src/shared/enum';
export class getSummaryDto {
  @IsString()
  meetingId: string;
  @IsEnum(SUMMARY_CORE, {
    message: `Summary Core must be one of the following values: ${Object.values(SUMMARY_CORE)}`,
  })
  summaryCore: SUMMARY_CORE;
  language: string;
  model: string;
}
