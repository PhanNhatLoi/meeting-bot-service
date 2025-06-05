import { Inject, Injectable } from '@nestjs/common';
import { ITranslationRepository } from '@database/interfaces/translation.repository.interface';
import { CreateTranslationDto } from './dto/translation.dto';
import { Translation } from '@database/entities/translation.entity';
import mongoose from 'mongoose';
import { FilterQuery } from 'mongoose';

@Injectable()
export class TranslationService {
  constructor(
    @Inject('ITranslationRepository')
    private readonly _translationRepository: ITranslationRepository,
  ) {}

  async create(payload: CreateTranslationDto): Promise<Translation> {
    try {
      return await this._translationRepository.create({ ...payload });
    } catch (error) {
      throw error;
    }
  }

  async replaceTranslation(
    meetingId: mongoose.Types.ObjectId,
    arrayItem: (CreateTranslationDto | any)[],
  ): Promise<Translation[]> {
    await this._translationRepository.permanentlyDeleteMany({
      meeting: meetingId,
    });
    return await this._translationRepository.insertMany(arrayItem);
  }

  async updateTranslation(
    condition: FilterQuery<Translation>,
    payload: Partial<Translation>,
  ): Promise<Translation> {
    return await this._translationRepository.update(condition, payload);
  }
}
