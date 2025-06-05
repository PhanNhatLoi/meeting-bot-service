import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BotService } from './bot.service.ts';
import { JoinMeetDto } from './dto/join.dto';
import { ApiTags } from '@nestjs/swagger';
import { LANGUAGE_CODE } from 'src/shared/enum';

@Controller('bot')
@ApiTags('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('join-meet')
  async handleJoinMeet(@Body() body: JoinMeetDto) {
    return await this.botService.autoJoin(
      body.platform,
      body.meetingCode,
      LANGUAGE_CODE[body.languageCode || 'vi'],
      body.params,
    );
  }

  @Post('stop/:meetingId')
  async handleStopBot(@Param('meetingId') meetingId: string) {
    return await this.botService.handleStopBot(meetingId);
  }

  @Get('info/:meetingId')
  async handleGetInfoRecord(@Param('meetingId') meetingId: string) {
    return await this.botService.handleGetInfo(meetingId);
  }
}
