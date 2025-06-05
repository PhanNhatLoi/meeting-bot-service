import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { FilterMeetDto } from './dto/filter-meet.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { ApiTags } from '@nestjs/swagger';
import { ApiBodyWithFiles } from 'src/base/decorators/swagger-form-data.decorator';
import { multerConfig } from 'src/configs/configuration.config';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';
import { Results } from 'src/base/response/result-builder';
import mongoose from 'mongoose';
import { UpdateMeetingDto } from './dto/create-meet.dto';
import { Translation } from '@database/entities/translation.entity';

@Controller('meeting')
@ApiTags('meeting')
@UseGuards(JwtAccessTokenGuard)
export class MeetingController {
  constructor(private readonly _meetingService: MeetingService) {}

  @Get('records')
  async handleGetAllRecords(@Query() pageOptionsDto: FilterMeetDto) {
    return await this._meetingService.getPagination(pageOptionsDto);
  }

  @Get('info/:meetingId')
  async handleGetInfo(@Param('meetingId') meetingId) {
    return await this._meetingService.handleGetInfo(meetingId);
  }

  @Post('import/:language')
  @UseGuards(JwtAccessTokenGuard)
  @ApiBodyWithFiles({
    limit: 1,
    local_options: { storage: multerConfig('/').storage },
  })
  async uploadMedia(
    @UploadedFiles()
    files: Express.Multer.File[],
    @Param('language') language,
  ) {
    if (!files || files?.length === 0) {
      throw new BadRequestException(
        Results.badRequest(
          'File is not provided',
          ERRORS_DICTIONARY.VALIDATION_ERROR,
        ),
      );
    }
    return this._meetingService.importMeeting(files[0], language);
  }

  @Put(':meetingId')
  async updateMeeting(
    @Param('meetingId') meetingId,
    @Body() payload: UpdateMeetingDto,
    @Req() req,
  ) {
    const { user } = req;
    return await this._meetingService.updateMeeting(
      {
        _id: new mongoose.Types.ObjectId(meetingId),
        user: user._id,
        deletedAt: null,
      },
      payload,
    );
  }

  @Delete(':meetingId')
  async deleteMeeting(@Param('meetingId') meetingId) {
    return await this._meetingService.deleteMeeting(meetingId);
  }

  @Put(':meetingId/translation/:translationId')
  async updateTranslation(
    @Param('meetingId') meetingId,
    @Param('translationId') translationId,
    @Body() payload: Partial<Translation>,
  ) {
    return await this._meetingService.handleUpdateTranslation(
      meetingId,
      translationId,
      payload,
    );
  }
}
