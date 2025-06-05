import { UserAccount } from '../entities/user-account.entity';
import { IBaseRepository } from 'src/base/repositories/base.interface.repository';

export abstract class IUserAccountRepository extends IBaseRepository<UserAccount> {}
