import { IsString } from 'class-validator';
export class GoogleMeetDto {
  @IsString()
  meetingCode: string;
}
