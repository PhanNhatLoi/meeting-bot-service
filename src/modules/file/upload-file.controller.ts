import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { IUploadFileService } from '@modules/file/services/upload-file.service.interface';
import { join } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';
import { Results } from 'src/base/response/result-builder';
import { Public } from 'src/base/decorators/auth.decorator';

@Controller('file')
@ApiTags('Upload file')
export class UploadFileController {
  constructor(private readonly _fileService: IUploadFileService) {}

  @Public()
  @Get(':filename')
  async getFilePublic(@Param('filename') filename: string, @Res() res) {
    try {
      const filePath = join(process.cwd(), 'files', filename);
      const fileExtension = filename.split('-').pop();
      const contentType = fileExtension.replace('.', '/');
      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath);
      return filePath;
    } catch (error) {
      throw new NotFoundException(
        Results.notFound('File not found', ERRORS_DICTIONARY.NOT_FOUND),
      );
    }
  }

  @Public()
  @Get('debug/:filename')
  async getFileDebug(@Param('filename') filename: string, @Res() res) {
    try {
      const filePath = join(process.cwd(), 'files', 'debugs', filename);
      const fileExtension = filename.split('-').pop();
      const contentType = fileExtension.replace('.', '/');
      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath);
      return filePath;
    } catch (error) {
      throw new NotFoundException(
        Results.notFound('File not found', ERRORS_DICTIONARY.NOT_FOUND),
      );
    }
  }
}
