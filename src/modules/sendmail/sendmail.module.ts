import { Module } from '@nestjs/common';
import { SendmailService } from './sendmail.service';

@Module({
  providers: [SendmailService],
})
export class SendmailModule {}
