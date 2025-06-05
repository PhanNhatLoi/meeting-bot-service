import { Injectable } from '@nestjs/common';
import { IUploadFileService } from './upload-file.service.interface';
import { UploadFileResponse } from './dto/upload-file.dto';
import { join } from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class UploadFileService implements IUploadFileService {
  async uploadFile(file: Express.Multer.File): Promise<UploadFileResponse> {
    return {
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async removeFile(filename: string): Promise<void> {
    const filePath = join(process.cwd(), 'files', filename);
    try {
      return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }
  async convertWebmToMp3(
    inputPath: string,
    outputPath: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .audioCodec('libmp3lame') // Chọn codec mp3
        .audioBitrate('128k') // Đặt bitrate âm thanh
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }
}
