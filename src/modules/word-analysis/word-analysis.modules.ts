import { Module } from '@nestjs/common';
import { WordAnalysisService } from './word-analysis.service';

@Module({
  providers: [WordAnalysisService],
})
export class WordAnalysisModule {}
