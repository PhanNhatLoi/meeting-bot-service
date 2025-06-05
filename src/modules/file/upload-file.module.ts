import { Module } from '@nestjs/common';
import { UploadFileController } from './upload-file.controller';
import { IUploadFileService } from './services/upload-file.service.interface';
import { UploadFileService } from './services/upload-file.service';

@Module({
  controllers: [UploadFileController],
  providers: [
    {
      provide: IUploadFileService,
      useClass: UploadFileService,
    },
  ],
  exports: [IUploadFileService],
})
export class UploadFileModule {}
