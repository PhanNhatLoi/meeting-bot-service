import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UserAccount } from 'src/database/entities/user-account.entity';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';
import { FilterQuery, PopulateOptions } from 'mongoose';
import { CreateUserAccountDto } from '../dto/create-user-account.dto';
import * as bcrypt from 'bcrypt';
import { IUserAccountRepository } from 'src/database/interfaces/user-account.repository.interface';

@Injectable()
export class UserAccountService {
  private readonly saltOrRounds = 12;
  constructor(
    @Inject('IUserAccountRepository')
    private readonly _userAccountRepository: IUserAccountRepository,
  ) {}

  async get(
    params: FilterQuery<UserAccount>,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<UserAccount> {
    const result = await this._userAccountRepository.findOneByCondition(
      params,
      populate,
    );
    if (!result) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.NOT_FOUND,
        details: 'User not found!!',
      });
    }

    if (result.deletedAt) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.DATA_DELETED,
        details: 'User is Deleted!!',
      });
    }
    return result;
  }
  async update(
    params: FilterQuery<UserAccount>,
    dto: Partial<UserAccount>,
  ): Promise<UserAccount> {
    try {
      await this.get(params);
      await this._userAccountRepository.update(params, dto);
      return await this.get(params);
    } catch (error) {
      throw error;
    }
  }
  async softDelete(id: string): Promise<object> {
    const result = await this._userAccountRepository.softDelete(id);
    if (result === true) {
      return {
        success: true,
        message: 'User successfully deleted',
      };
    } else {
      return {
        success: false,
        message: 'User soft delete failed, invalid ID or user not found',
      };
    }
  }
  async create(payload: CreateUserAccountDto): Promise<UserAccount> {
    const checkUnique = await this._userAccountRepository.findOneByCondition({
      email: payload.email,
    });

    if (checkUnique?.emailVerified) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.DATA_EXISTED,
        details: 'User exits!!!',
      });
    }
    const newAccount = {
      ...payload,
      password: await this.hashPassword(payload.password),
    };
    const userAccount = await this._userAccountRepository.findOneAndUpdate(
      { email: payload.email },
      newAccount,
    );
    if (userAccount) {
      delete userAccount.password;
    }
    return userAccount;
  }
  async hashPassword(password: string): Promise<string> {
    const passwordHash = await bcrypt.hash(password, this.saltOrRounds);
    return passwordHash;
  }
}
