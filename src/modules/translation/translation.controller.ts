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
import { ApiTags } from '@nestjs/swagger';
import { TranslationService } from './translation.service';
@Controller('translation')
@ApiTags('translation')
export class TranslationController {
  constructor(private readonly _translationService: TranslationService) {}

  // @Get('records')
  // async handleGetAllRecords(@Query() pageOptionsDto: FilterMeetDto) {
  //   return await this._meetingService.getPagination(pageOptionsDto);
  // }
}
