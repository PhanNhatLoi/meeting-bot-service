import { Module } from '@nestjs/common';
import { OtpCodeService } from './services/otp-code.service';

@Module({
  imports: [],
  providers: [OtpCodeService],
})
export class OtpCodeModule {}
