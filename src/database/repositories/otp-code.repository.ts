import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepositoryAbstract } from 'src/base/repositories/base.abstract.repository';
import { OtpCode } from '@database/entities/otp-code.entity';
import { IOtpCodeRepository } from '@database/interfaces/otp-code.repository.interface';

@Injectable()
export class OtpCodeRepository
  extends BaseRepositoryAbstract<OtpCode>
  implements IOtpCodeRepository
{
  constructor(
    @InjectModel(OtpCode.name)
    private readonly _otpCodeRepository: Model<OtpCode>,
  ) {
    super(_otpCodeRepository);
  }
}
