import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
export class ChangePasswordDto {
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;

  @IsNotEmpty()
  @MinLength(8)
  oldPassword: string;
}

export class verifyChangePasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;

  @IsNotEmpty()
  @Length(6)
  @IsString()
  accessKey: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;

  @IsNotEmpty()
  @IsString()
  redirectUri: string;

  @IsNotEmpty()
  @IsString()
  backendUri: string;
}
