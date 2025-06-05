import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';
import { IOtpCodeRepository } from '@database/interfaces/otp-code.repository.interface';
import { OtpCode } from '@database/entities/otp-code.entity';
import { FilterOtpCodeDto } from '@modules/otp-code/dto/filter-otp.dto';
import { VerifyOtpCodeDto } from '@modules/otp-code/dto/verify-otp.dto';
import { UserAccountService } from '@modules/user-account/services/user-account.service';
export const otpTime = 300;

@Injectable()
export class OtpCodeService {
  private readonly otpLength = 5;
  constructor(
    @Inject('IOtpCodeRepository')
    private readonly _otpCodeRepository: IOtpCodeRepository,
    private readonly _userAccountService: UserAccountService,
  ) {}

  async generateOtp(): Promise<string> {
    const otpCode = Math.floor(
      Math.pow(10, this.otpLength - 1) +
        Math.random() * (Math.pow(10, this.otpLength - 1) * 9),
    ).toString(); //generate code otpLength digit

    return otpCode;
  }

  async create(email: string, hardOtp?: string): Promise<OtpCode> {
    await this._userAccountService.get({
      email,
    });
    const otpCode = hardOtp || (await this.generateOtp());
    const dateNow = new Date();
    const otp = await this._otpCodeRepository.findOneByCondition({
      email,
    });
    if (otp && new Date(otp.expiresAt).getTime() > new Date().getTime()) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.TIME_LIMIT,
        details: 'Limit send otp time, please try later!!',
      });
    }
    return await this._otpCodeRepository.findOneAndUpdate(
      { email },
      {
        otpCode: otpCode,
        expiresAt: new Date(dateNow.getTime() + otpTime * 1000),
        isActive: true,
      },
    );
  }
  async get(payload: FilterOtpCodeDto): Promise<OtpCode> {
    const result = await this._otpCodeRepository.findOneByCondition(payload);
    if (!result) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.NOT_FOUND,
        details: 'Otp wrong!!',
      });
    }

    if (
      !result.expiresAt ||
      new Date(result.expiresAt).getTime() < new Date().getTime()
    ) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.VALIDATION_ERROR,
        details: 'Otp exp!!',
      });
    }

    return result;
  }
  async delete(id: string): Promise<Boolean> {
    try {
      const otp = await this._otpCodeRepository.findOneById(id);
      if (!otp) {
        throw new BadRequestException({
          message: ERRORS_DICTIONARY.NOT_FOUND,
          details: 'otp code not found!!!',
        });
      }
      await this._otpCodeRepository.permanentlyDelete(id);
      return true;
    } catch (error) {
      throw error;
    }
  }
  async verifyOtp(payload: VerifyOtpCodeDto): Promise<Boolean> {
    try {
      await this.get(payload);
      // await this._otpCodeRepository.permanentlyDelete(otpCode.id);
      return true;
    } catch (error) {
      throw error;
    }
  }
  async findOtp(payload: FilterOtpCodeDto): Promise<OtpCode> {
    const result = await this._otpCodeRepository.findOneByCondition(payload);
    return result;
  }
}
