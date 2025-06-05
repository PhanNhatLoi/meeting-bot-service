import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepositoryAbstract } from 'src/base/repositories/base.abstract.repository';
import { WordAnalysis } from '@database/entities/word-analysis.entity';
import { IWordAnalysisRepository } from '@database/interfaces/word-analysis.repository.interface';

@Injectable()
export class WordAnalysisRepository
  extends BaseRepositoryAbstract<WordAnalysis>
  implements IWordAnalysisRepository
{
  constructor(
    @InjectModel(WordAnalysis.name)
    private readonly _wordAnalysisRepository: Model<WordAnalysis>,
  ) {
    super(_wordAnalysisRepository);
  }
}
