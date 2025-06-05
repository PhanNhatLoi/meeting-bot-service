import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepositoryAbstract } from 'src/base/repositories/base.abstract.repository';
import { Translation } from '@database/entities/translation.entity';
import { ITranslationRepository } from '@database/interfaces/translation.repository.interface';

@Injectable()
export class TranslationRepository
  extends BaseRepositoryAbstract<Translation>
  implements ITranslationRepository
{
  constructor(
    @InjectModel(Translation.name)
    private readonly _translationRepository: Model<Translation>,
  ) {
    super(_translationRepository);
  }
}
