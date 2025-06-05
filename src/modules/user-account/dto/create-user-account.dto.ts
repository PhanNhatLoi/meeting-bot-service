import { DOMAIN_URL } from 'src/shared/enum';

export class CreateUserAccountDto {
  email: string;
  password: string;
  avatar?: string;
  name: string;
  // createdBy?: string;
  emailVerified?: boolean;
  // domain?: DOMAIN_URL;
}
