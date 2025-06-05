import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtServiceConfig } from 'src/configs/config.interface';
import { AuthResponseDto } from 'src/modules/auth/dto/auth-response.dto';
import { TokenPayload } from 'src/modules/auth/interfaces/token.interface';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';
import {
  access_token_private_key,
  refresh_token_private_key,
} from 'src/shared/constants/jwt.constaint';
import { UserAccount } from '@database/entities/user-account.entity';
import { SignUpDto } from '@modules/auth/dto/sign-up.dto';
import { SendmailService } from 'src/modules/sendmail/sendmail.service';
import { VerifyEmailDto } from '@modules/auth/dto/verify-email.dto';
import {
  ChangePasswordDto,
  verifyChangePasswordDto,
} from '@modules/auth/dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { SendOtpDto } from '@modules/auth/dto/send-otp.dto';
import { Result } from 'src/base/response/result';
import { Results } from 'src/base/response/result-builder';
import { UpdateAccountInfoDto } from '../dto/update-info.dto';
import { UserAccountService } from '@modules/user-account/services/user-account.service';
import { OtpCodeService } from '@modules/otp-code/services/otp-code.service';
import { IIdentityService } from 'src/shared/services/identity.service.interface';
import { PaymentService } from '@modules/payment/payment.service';
import { SignUpTemplate } from '@modules/sendmail/template/signUp-html';
import { ForgotTemplate } from '@modules/sendmail/template/fogotpassword-html';

@Injectable()
export class AuthService {
  private readonly _jwtServiceConfig: JwtServiceConfig;

  constructor(
    private readonly _userAccountService: UserAccountService,
    private readonly _jwtService: JwtService,
    private readonly _sendMailService: SendmailService,
    private readonly _otpCodeService: OtpCodeService,
    private readonly _identityService: IIdentityService,
    private readonly _paymentService: PaymentService,

    configService: ConfigService,
  ) {
    this._jwtServiceConfig =
      configService.getOrThrow<JwtServiceConfig>('jwtServiceConfig');
  }
  async getUserIfRefreshTokenMatched(
    id: string,
    token?: string,
  ): Promise<UserAccount> {
    try {
      const user = await this._userAccountService.get({ _id: id });
      if (!user) {
        throw new UnauthorizedException({
          message: ERRORS_DICTIONARY.WRONG_CREDENTIALS,
          details: 'Unauthorized',
        });
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async signUp(userDto: SignUpDto): Promise<Result<{ otpTime: number }>> {
    try {
      await this._userAccountService.create(userDto);
      const otp = await this._otpCodeService.findOtp({ email: userDto.email });
      if (otp && new Date(otp.expiresAt) > new Date()) {
        return Results.success(
          { otpTime: 300 },
          'An otp email has been sent to your email, please check',
        );
      }
      const otpCode = await this._otpCodeService.create(userDto.email);
      const htmlTemplate = SignUpTemplate(otpCode.otpCode);
      await this._sendMailService.sendmail({
        sendTo: userDto.email,
        subject: '<noreply> This is email verify Email register',
        content: htmlTemplate,
      });
      return Results.success(
        { otpTime: otpCode.otpTime },
        'Register success, please check Email',
      );
    } catch (error) {
      throw error;
    }
  }

  async verifyEmailSignUp(payload: VerifyEmailDto): Promise<Result<{}>> {
    try {
      const userCheck = await this._userAccountService.get({
        email: payload.email,
      });
      if (!userCheck.emailVerified) {
        await this._otpCodeService.verifyOtp(payload);
        await this._userAccountService.update(
          { email: payload.email },
          { emailVerified: true },
        );
        const otp = await this._otpCodeService.findOtp({
          otpCode: payload.otpCode,
        });
        if (otp) {
          await this._otpCodeService.delete(otp.id);
        }
      }
      const user = await this._userAccountService.get({ email: payload.email });
      const token = await this.generateAccessToken({ id: user.id });
      const refreshToken = await this.generateRefreshToken({ id: user.id });
      const profileInfo = await this.getProfile(user.id);
      return Results.success(
        {
          accessToken: token,
          refreshToken: refreshToken,
          userInfo: profileInfo.response,
        },
        'Activated email success',
      );
    } catch (error) {
      throw error;
    }
  }

  async signIn(id: string): Promise<Result<AuthResponseDto>> {
    try {
      const accessToken = await this.generateAccessToken({ id });
      const refreshToken = await this.generateRefreshToken({ id });

      const userProfile = await this.getProfile(id);
      const otp = await this._otpCodeService.findOtp({
        email: userProfile.response.email,
      });
      if (otp) {
        await this._otpCodeService.delete(otp.id);
      }
      return Results.success({
        accessToken,
        refreshToken,
        userInfo: userProfile.response,
      });
    } catch (error) {
      throw error;
    }
  }

  async getAuthenticatedUser(
    email: string,
    password: string,
  ): Promise<UserAccount> {
    try {
      const user = await this._userAccountService.get({ email: email });

      if (!user) {
        throw new BadRequestException({
          message: ERRORS_DICTIONARY.NOT_FOUND,
          details: 'User not found!!',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new BadRequestException({
          message: ERRORS_DICTIONARY.WRONG_CREDENTIALS,
          details: 'Wrong credentials!!',
        });
      }
      if (!user.emailVerified) {
        throw new BadRequestException({
          message: ERRORS_DICTIONARY.DATA_NOT_ACTIVE,
          details: 'Email not activated!!',
        });
      }

      delete user.password;

      return user;
    } catch (error) {
      throw error;
    }
  }

  generateAccessToken(payload: TokenPayload) {
    return Promise.resolve(
      this._jwtService.sign(payload, {
        algorithm: 'RS256',
        privateKey: access_token_private_key,
        expiresIn: `${this._jwtServiceConfig.accessTokenExpirationTime}`,
      }),
    );
  }

  generateRefreshToken(payload: TokenPayload) {
    return Promise.resolve(
      this._jwtService.sign(payload, {
        algorithm: 'RS256',
        privateKey: refresh_token_private_key,
        expiresIn: `${this._jwtServiceConfig.refreshTokenExpirationTime}`,
      }),
    );
  }

  async sendOtp(
    payload: SendOtpDto,
    type: 'register' | 'resetPassword',
  ): Promise<Result<{ otpTime: number }>> {
    try {
      const user = await this._userAccountService.get({ email: payload.email });
      if (type === 'resetPassword') {
        if (!user.emailVerified) {
          throw new BadRequestException({
            message: ERRORS_DICTIONARY.DATA_NOT_ACTIVE,
            details: 'User not active!!',
          });
        }
      }
      const currentOtp = await this._otpCodeService.findOtp({
        email: payload.email,
      });
      if (
        currentOtp &&
        new Date(currentOtp.expiresAt).getTime() > new Date().getTime()
      ) {
        throw new BadRequestException({
          message: ERRORS_DICTIONARY.TIME_LIMIT,
          details: 'Limit send otp time, please try later!!',
        });
      }
      const otpCode = await this._otpCodeService.generateOtp();
      const htmlTemplate =
        type === 'register' ? SignUpTemplate(otpCode) : ForgotTemplate(otpCode);
      await this._sendMailService.sendmail({
        sendTo: payload.email,
        subject: '<noreply> This is email verify Email Otp',
        content: htmlTemplate,
      });
      const newCode = await this._otpCodeService.create(payload.email, otpCode);
      return Results.success(
        { otpTime: newCode.otpTime },
        'An otp email has been sent to your email, please check',
      );
    } catch (error) {
      throw error;
    }
  }

  async changePassword(payload: ChangePasswordDto): Promise<Result<{}>> {
    const userAccount = await this._userAccountService.get({
      email: payload.email,
    });

    if (!userAccount) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.NOT_FOUND,
        details: 'User not found!!',
      });
    }
    if (userAccount.accessKey !== payload.accessKey) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.NOT_FOUND,
        details: 'accessKey Wrong!!',
      });
    }

    const newPasswordHash = await this._userAccountService.hashPassword(
      payload.newPassword,
    );

    await this._userAccountService.update(
      { email: payload.email },
      { password: newPasswordHash, accessKey: '' },
    );

    return Results.success(null, 'Change password successfully');
  }

  async verifyChangePassword(
    payload: verifyChangePasswordDto,
  ): Promise<Result<{ accessKey: string }>> {
    try {
      await this._otpCodeService.verifyOtp(payload);
      const accessKey = this.generateString(6);
      await this._userAccountService.update(
        { email: payload.email },
        { accessKey: accessKey },
      );
      return Results.success({ accessKey: accessKey });
    } catch (error) {
      throw error;
    }
  }

  generateString = (length: number) => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  };

  async getProfile(userId?: string): Promise<Result<UserAccount>> {
    const profile = await this._userAccountService.get(
      { _id: userId || this._identityService.id },
      [
        {
          path: 'userSubcriptions',
          match: { deletedAt: null },
          options: { sort: { createdAt: -1 }, limit: 1 },
        },
      ],
    );
    const product = await this._paymentService.getProductInfo(
      profile?.userSubcriptions[0]?.stripe_product_id,
    );

    return Results.success({
      ...(profile as any).toJSON(),
      subcription: product,
    });
  }

  async updateProfile(
    userId: string,
    payload: UpdateAccountInfoDto,
  ): Promise<Result<UserAccount>> {
    const updatedUser = await this._userAccountService.update(
      { _id: userId },
      payload,
    );
    if (!updatedUser) {
      return Results.badRequest('User not found');
    }
    return Results.success(updatedUser);
  }

  async deleteUser(user): Promise<Result<{}>> {
    await this._userAccountService.get({ _id: user._id });
    await this._userAccountService.softDelete(user._id);
    return Results.success(null, 'User has been successfully deleted');
  }

  async signInOrSignUpUserAccountByGoogle(
    user: any,
  ): Promise<Result<AuthResponseDto>> {
    try {
      const result = await this._userAccountService.get({ email: user.email });
      return await this.signIn(result.id);
    } catch (error) {
      if (error?.response?.message === ERRORS_DICTIONARY.NOT_FOUND) {
        const newUser = await this._userAccountService.create({
          email: user.email,
          name: user.name,
          emailVerified: user.email_verified,
          avatar: user.picture,
          password: this.generateString(8),
        });
        return await this.signIn(newUser.id);
      } else throw error;
    }
  }
}
