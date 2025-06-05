import { Meeting } from '../entities/meeting.entity';
import { IBaseRepository } from 'src/base/repositories/base.interface.repository';

export abstract class IMeetingRepository extends IBaseRepository<Meeting> {}
