import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LANGUAGE_KEY, PLATFORM } from 'src/shared/enum';
export class JoinMeetDto {
  @IsString()
  meetingCode: string;
  @IsEnum(PLATFORM, {
    message: `platform must be one of the following values: ${Object.values(PLATFORM)}`,
  })
  platform: PLATFORM;
  params?: string;
  @IsOptional()
  @IsEnum(LANGUAGE_KEY, {
    message: `languageCode must be one of the following values: ${Object.keys(LANGUAGE_KEY)}`,
  })
  languageCode: LANGUAGE_KEY;
}
