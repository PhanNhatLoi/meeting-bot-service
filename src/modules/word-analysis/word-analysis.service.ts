import { Injectable, Inject } from '@nestjs/common';
import { IWordAnalysisRepository } from '@database/interfaces/word-analysis.repository.interface';
import { WordAnalysis } from '@database/entities/word-analysis.entity';
import {
  CreateWordAnalysisDto,
  UpdateWordAnalysisDto,
} from './dto/word-analysis.dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class WordAnalysisService {
  constructor(
    @Inject('IWordAnalysisRepository')
    private readonly _wordAnalysisRepository: IWordAnalysisRepository,
  ) {}
  async create(dto: CreateWordAnalysisDto): Promise<WordAnalysis> {
    return await this._wordAnalysisRepository.create(dto);
  }

  async update(
    conditions: FilterQuery<WordAnalysis>,
    payload: UpdateWordAnalysisDto,
  ): Promise<WordAnalysis> {
    return await this._wordAnalysisRepository.update(conditions, payload);
  }

  async getWordAnalysis(
    conditions: FilterQuery<WordAnalysis>,
  ): Promise<WordAnalysis> {
    return await this._wordAnalysisRepository.findOneByCondition(conditions);
  }
}
