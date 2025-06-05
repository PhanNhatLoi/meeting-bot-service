import { OtpCode } from '@database/entities/otp-code.entity';
import { IBaseRepository } from 'src/base/repositories/base.interface.repository';

export abstract class IOtpCodeRepository extends IBaseRepository<OtpCode> {}
