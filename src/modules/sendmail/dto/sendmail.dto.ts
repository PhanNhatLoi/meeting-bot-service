import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class SendMailDto {
  @IsNotEmpty()
  @ApiProperty()
  sendTo: string;

  @IsNotEmpty()
  @ApiProperty()
  content: string;

  @IsNotEmpty()
  @ApiProperty()
  subject: string;
}
