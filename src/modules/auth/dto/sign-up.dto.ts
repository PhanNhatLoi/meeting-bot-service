import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
export class SignUpDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;

  @IsOptional()
  avatar: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  name: string;
}
