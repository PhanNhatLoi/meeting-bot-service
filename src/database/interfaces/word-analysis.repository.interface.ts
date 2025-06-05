import { WordAnalysis } from '@database/entities/word-analysis.entity';
import { IBaseRepository } from 'src/base/repositories/base.interface.repository';

export abstract class IWordAnalysisRepository extends IBaseRepository<WordAnalysis> {}
