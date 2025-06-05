import { UploadFileResponse } from './dto/upload-file.dto';

export abstract class IUploadFileService {
  abstract uploadFile(file: Express.Multer.File): Promise<UploadFileResponse>;
  abstract removeFile(fileName: string): Promise<void>;
  abstract convertWebmToMp3(
    inputPath: string,
    outputPath: string,
  ): Promise<string>;
}
