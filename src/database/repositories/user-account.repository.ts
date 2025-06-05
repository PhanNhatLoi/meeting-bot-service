import { UserAccount } from 'src/database/entities/user-account.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepositoryAbstract } from 'src/base/repositories/base.abstract.repository';
import { IUserAccountRepository } from 'src/database/interfaces/user-account.repository.interface';

@Injectable()
export class UserAccountRepository
  extends BaseRepositoryAbstract<UserAccount>
  implements IUserAccountRepository
{
  constructor(
    @InjectModel(UserAccount.name)
    private readonly usersRepository: Model<UserAccount>,
  ) {
    super(usersRepository);
  }
  async getUser(condition: any): Promise<UserAccount> {
    const excludeFields = {
      password: false,
      __v: false,
      deletedAt: false,
    };
    return await this.usersRepository
      .findOne({
        ...condition,
        deletedAt: null,
      })
      .select(excludeFields)
      .exec();
  }
}
