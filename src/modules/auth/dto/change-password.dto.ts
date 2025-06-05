import {
  IsEmail,
  IsNotEmpty,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
export class ChangePasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;

  @IsNotEmpty()
  @Length(6)
  accessKey: string;
}

export class verifyChangePasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;

  @IsNotEmpty()
  @Length(5)
  otpCode: string;
}
