import { IsOptional } from 'class-validator';

export class UpdateAccountInfoDto {
  @IsOptional()
  phoneNumber: string;
  @IsOptional()
  name: string;
  // ...field
}
