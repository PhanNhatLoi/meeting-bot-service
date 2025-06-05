import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
export class SendOtpDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;
}
