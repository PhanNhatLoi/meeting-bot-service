import { UserAccount } from '@database/entities/user-account.entity';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  userInfo: AccountInfoResponseDto;
}

export class AccountInfoResponseDto extends UserAccount {}
