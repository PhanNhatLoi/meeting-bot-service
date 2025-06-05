import { Translation } from '@database/entities/translation.entity';
import { IBaseRepository } from 'src/base/repositories/base.interface.repository';

export abstract class ITranslationRepository extends IBaseRepository<Translation> {}
