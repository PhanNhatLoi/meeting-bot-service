import { UserSubcription } from '../entities/user-subcription.entity';
import { IBaseRepository } from 'src/base/repositories/base.interface.repository';

export abstract class IUserSubcriptionRepository extends IBaseRepository<UserSubcription> {}
