import { Module } from '@nestjs/common';
import { UserAccountService } from './services/user-account.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [UserAccountService],
  exports: [UserAccountService],
})
export class UserAccountModule {}
