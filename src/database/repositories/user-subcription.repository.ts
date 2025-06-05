import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepositoryAbstract } from 'src/base/repositories/base.abstract.repository';
import { OtpCode } from '@database/entities/otp-code.entity';
import { IUserSubcriptionRepository } from '@database/interfaces/user-subcription.entity';
import { UserSubcription } from '@database/entities/user-subcription.entity';

@Injectable()
export class UserSubcriptionRepository
  extends BaseRepositoryAbstract<UserSubcription>
  implements IUserSubcriptionRepository
{
  constructor(
    @InjectModel(UserSubcription.name)
    private readonly _userSubcriptionRepository: Model<UserSubcription>,
  ) {
    super(_userSubcriptionRepository);
  }
}
