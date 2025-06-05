import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Delete,
  Get,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/base/types/requests.type';
import { SignInDto } from 'src/modules/auth/dto/sign-in.dto';
import { JwtRefreshTokenGuard } from 'src/modules/auth/guards/jwt-refresh-token.guard';
import { LocalAuthGuard } from 'src/modules/auth/guards/local.guard';
import { SignUpDto } from '@modules/auth/dto/sign-up.dto';
import { JwtAccessTokenGuard } from './guards/jwt-access-token.guard';
import { VerifyEmailDto } from '@modules/auth/dto/verify-email.dto';
import {
  ChangePasswordDto,
  verifyChangePasswordDto,
} from '@modules/auth/dto/change-password.dto';
import { SendOtpDto } from '@modules/auth/dto/send-otp.dto';
import { Results } from 'src/base/response/result-builder';
import { UserAccount } from '@database/entities/user-account.entity';
import { UpdateAccountInfoDto } from './dto/update-info.dto';
import { AuthService } from './services/auth.service';
import { GoogleAuthGuardLocal } from '@modules/google/guards/local-gooogle-auth.guard';
import { Public } from 'src/base/decorators/auth.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  // ==========
  // Sign In
  // ==========
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  @ApiBody({
    type: SignInDto,
    examples: {
      user: {
        value: {
          email: 'nhatloi2@yopmail.com',
          password: '12345678@Abc',
        } as SignInDto,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Wrong credentials!!',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: {
          ...Results.success({
            accessToken:
              'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2VkNDBiNTEwMDMzMjhlMDc0MzEwMCIsImlhdCI6MTcyNDkwMDgyMywiZXhwIjoxNzI0OTA0NDIzfQ.tu7lefHYsPUSbq0PYfCByxliYhQL_N2j-9cdcOUyR_F54dy1rU08Hm6A4eaticI7F17hwwuVqa7ZEOftOa6r8rnRlH3LFm107m6GwTiI-Tt2dz482mPWsg1kru3bo20VVJ3ispOomXcXEfih8qZxoznwYqjNNkN5GZ92YFCvGk0qsKf6lHZNl8JyiI34pPu-AhjZ0k_2x-Ozv2jZNyB2MtDiVSCv5-3TBNpfIMcfEDqfD7xzuh0ab6ZDJSX_xWfiP82vmkvRdqh1mHtZjheK3QJURBa-ZRFxO3LvQKyNOHCMWzE-IauwFnXZNpxO8VETjDbPjKegrRku5IGVqFLU9Q',
            refreshToken:
              'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2VkNDBiNTEwMDMzMjhlMDc0MzEwMCIsImlhdCI6MTcyNDkwMDgyMywiZXhwIjoxNzI0OTg3MjIzfQ.A9ZaPvrjJYEzujUaPwQoKOp3E7FPqwhn1ZRex9OFIuSyNc8HdfWIU5aHvju_hwto5FoMmtmh2qDmhDDr6vua3wt_LfDF_TR-zUj7kJtlQHAs2vYSBXDLA9zbVhirywYIBlN1_tA3zK2V7V64oUUZEuPda7KPgGPNZ-SsMpSbZCnrIR8_A7zYYerasMHhPxuO7pAYoxwqPvjQnpr7QnYKhPpR4iqLvEqQHZ-Od6cbqrBHTwp4vO_xaOUWEHrBXxvAbxMQ8i3eNFow1lAjHSs3ePP-_eZuy-8yrh4aIZTBzPZzAUVXaia8K4PChj35_OO13sWKPLX8c_l6aRgPvngcOw',
          }),
        },
      },
    },
  })
  async signIn(@Req() request: RequestWithUser) {
    const { user } = request;
    return await this._authService.signIn(user.id);
  }
  // ==========
  // Sign In
  // ==========

  // ==========
  // Sign Up
  // ==========
  @Post('sign-up')
  @Public()
  @ApiBody({
    type: SignUpDto,
    examples: {
      user: {
        value: {
          name: 'example',
          email: 'exampleuser@myzens.net',
          password: '12345678',
        } as SignUpDto,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User exits',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'ATH_0091',
          details: 'User exits!!!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: {
          ...Results.success(
            { otpTime: 60 },
            'Register success, please check Email',
          ),
        },
      },
    },
  })
  async signUp(@Body() signUp: SignUpDto) {
    return await this._authService.signUp(signUp);
  }
  // ==========
  // Sign Up
  // ==========

  // ==========
  // active account
  // ==========
  @Post('active-account')
  @Public()
  @ApiBody({
    type: VerifyEmailDto,
    examples: {
      user: {
        value: {
          email: 'useraccount@myzens.net',
          otpCode: '11111',
        } as VerifyEmailDto,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: { ...Results.success(null, 'Activated email success') },
      },
    },
  })
  async verifyEmail(@Body() payload: VerifyEmailDto) {
    return await this._authService.verifyEmailSignUp(payload);
  }
  // ==========
  // active account
  // ==========

  // ==========
  // Get info
  // ==========
  // @UseGuards(JwtAccessTokenGuard)
  @Get('get-info')
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Wrong credentials!!',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: {
          ...Results.success({
            createdDate: '2024-06-04T02:16:42.000Z',
            email: 'useraccount@myzens.net',
            phone: '+84361111111',
            emailVerified: true,
          }),
        },
      },
    },
  })
  async getInfo() {
    return await this._authService.getProfile();
  }
  // ==========
  // Get info
  // ==========

  // @UseGuards(JwtAccessTokenGuard)
  @Post('update-info')
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'Wrong credentials!!',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: {
          ...Results.success({
            createdDate: '2024-06-04T02:16:42.000Z',
            email: 'useraccount@myzens.net',
            phone: '+84361111111',
            emailVerified: true,
          }),
        },
      },
    },
  })
  async updateInfo(@Body() info: UpdateAccountInfoDto, @Req() req) {
    const { user } = req;

    return await this._authService.updateProfile(user._id, info);
  }
  // ==========
  // refreshToken
  // ==========
  @Public()
  @UseGuards(JwtRefreshTokenGuard)
  @Post('refresh')
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: {
          ...Results.success({
            accessToken:
              'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2VkNDBiNTEwMDMzMjhlMDc0MzEwMCIsImlhdCI6MTcyNDkwMDgyMywiZXhwIjoxNzI0OTA0NDIzfQ.tu7lefHYsPUSbq0PYfCByxliYhQL_N2j-9cdcOUyR_F54dy1rU08Hm6A4eaticI7F17hwwuVqa7ZEOftOa6r8rnRlH3LFm107m6GwTiI-Tt2dz482mPWsg1kru3bo20VVJ3ispOomXcXEfih8qZxoznwYqjNNkN5GZ92YFCvGk0qsKf6lHZNl8JyiI34pPu-AhjZ0k_2x-Ozv2jZNyB2MtDiVSCv5-3TBNpfIMcfEDqfD7xzuh0ab6ZDJSX_xWfiP82vmkvRdqh1mHtZjheK3QJURBa-ZRFxO3LvQKyNOHCMWzE-IauwFnXZNpxO8VETjDbPjKegrRku5IGVqFLU9Q',
          }),
        },
      },
    },
  })
  async refreshAccessToken(@Req() request: RequestWithUser) {
    const { user } = request;
    const accessToken = await this._authService.generateAccessToken({
      id: user.id,
    });
    return Results.success({ accessToken });
  }
  // ==========
  // refreshToken
  // ==========

  // ==========
  // forget password
  // ==========

  @Post('forget-password')
  @Public()
  @ApiBody({
    type: SendOtpDto,
    examples: {
      user: { value: { email: 'exampleuser@myzens.net' } as SendOtpDto },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User exits',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'ATH_0091',
          details: 'User exits!!!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: {
          ...Results.success(
            { otpTime: 60 },
            'An otp email has been sent to your email, please check',
          ),
        },
      },
    },
  })
  async forgetPassword(@Body() payload: SendOtpDto) {
    return await this._authService.sendOtp(payload, 'resetPassword');
  }
  // ==========
  // forget password
  // ==========
  // ==========
  // resend otp
  // ==========

  @Post('resend-otp')
  @Public()
  @ApiBody({
    type: SendOtpDto,
    examples: {
      user: { value: { email: 'exampleuser@myzens.net' } as SendOtpDto },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User exits',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: 'ATH_0091',
          details: 'User exits!!!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: {
          ...Results.success(
            { otpTime: 60 },
            'An otp email has been sent to your email, please check',
          ),
        },
      },
    },
  })
  async resendOtp(@Body() payload: SendOtpDto) {
    return await this._authService.sendOtp(payload, 'register');
  }
  // ==========
  // resend otp
  // ==========

  // ==========
  // verify otp change password
  // ==========

  @Post('verify-change-password')
  @Public()
  @ApiBody({
    type: verifyChangePasswordDto,
    examples: {
      user: {
        value: {
          email: 'exampleuser@myzens.net',
          otpCode: '11111',
        } as verifyChangePasswordDto,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    content: {
      'application/json': {
        example: { ...Results.success({ accessKey: 'QdEpwu' }) },
      },
    },
  })
  async verifyChangePassword(@Body() payload: verifyChangePasswordDto) {
    return await this._authService.verifyChangePassword(payload);
  }
  // ==========
  // verify otp change password
  // ==========

  // ==========
  // change password
  // ==========

  @Post('change-password')
  @Public()
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      user: {
        value: {
          email: 'exampleuser@myzens.net',
          newPassword: '12345678',
          accessKey: 'QdEpwu',
        } as ChangePasswordDto,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'success',
    content: {
      'application/json': {
        example: { ...Results.success(null, 'Change password successfully') },
      },
    },
  })
  async changePassword(@Body() payload: ChangePasswordDto) {
    return await this._authService.changePassword(payload);
  }
  // ==========
  // change password
  // ==========
  @UseGuards(JwtAccessTokenGuard)
  @Delete()
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
    content: {
      'application/json': {
        example: { message: 'User has been successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        },
      },
    },
  })
  async deleteUser(@Req() req: { user: UserAccount }) {
    return await this._authService.deleteUser(req.user);
  }

  // ==========
  // sign in with google
  // ==========

  @Post('sign-in-with-google')
  @Public()
  @UseGuards(GoogleAuthGuardLocal)
  async signInWithGoogle(@Req() req) {
    const { user } = req;
    return await this._authService.signInOrSignUpUserAccountByGoogle(user);
  }
  // ==========
  // sign in with google
  // ==========
}
