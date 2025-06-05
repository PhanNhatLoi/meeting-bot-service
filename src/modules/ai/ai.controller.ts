import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { getSummaryDto } from './dto/summary.dto';
import { SUMMARY_CORE } from 'src/shared/enum';

@Controller('ai')
@ApiTags('AI')
@UseGuards(JwtAccessTokenGuard)
export class AiController {
  constructor(private readonly _aiService: AiService) {}

  @Get('summary/:meetingId/:summaryCore/:language')
  async handleGetSummary(@Param() params: getSummaryDto) {
    const { meetingId, summaryCore, language } = params;
    return await this._aiService.getSummaryText(
      meetingId,
      summaryCore,
      language,
    );
  }

  @Get('translation/:meetingId/:summaryCore/:language')
  async handleTranslationText(@Param() params: getSummaryDto) {
    const { meetingId, summaryCore, language } = params;
    return await this._aiService.handleTranslationText(
      meetingId,
      summaryCore,
      language,
    );
  }

  @Post('chat')
  async chat(
    @Body() body: { meetingId: string; core: SUMMARY_CORE; message: string },
  ) {
    const { meetingId, core, message } = body;
    return await this._aiService.chat(core, meetingId, message);
  }
  @Delete('chat/:meetingId')
  async deleteChat(@Param('meetingId') meetingId: string) {
    return await this._aiService.deleteChat(meetingId);
  }
}
