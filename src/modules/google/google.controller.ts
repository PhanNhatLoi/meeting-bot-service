import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';
import { Public } from 'src/base/decorators/auth.decorator';
import { Results } from 'src/base/response/result-builder';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';

// Định nghĩa type cho request với user
interface RequestWithUser extends Request {
  user: any;
}

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Public()
  @Get()
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  // Endpoint nhận thông báo
  @Public()
  @Post('notifications/:email')
  async handleNotifications(@Res() res, @Param('email') email: string) {
    console.log('Nhận thông báo từ Google: cho email ', email);
    this.googleService.getEvents(email, 'primary');
    res.status(200).send('OK');
  }

  @Public()
  @Get('redirect')
  async handleGoogleRedirect(@Req() req: Request, @Res() res: Response) {
    const { code, state } = req.query;
    const { expoUri } = JSON.parse(state as string);
    return res.redirect(`${expoUri}?code=${code}&state=${state}`);
  }

  @Public()
  @Post('register-calendar')
  async watchCalendarApp(@Req() req: Request) {
    try {
      const { accessToken, refreshToken, email, domainUrl } = req.body;
      const calendarId = 'primary';
      await this.googleService.watchCalendar(
        accessToken,
        refreshToken,
        calendarId,
        email,
        domainUrl,
      );

      return Results.success(true);
    } catch (error) {
      return Results.error(error);
    }
  }

  @Post('unregister-calendar')
  @UseGuards(JwtAccessTokenGuard)
  async unregisterCalendar(@Req() req: RequestWithUser) {
    try {
      const user = req.user;

      if (!user || !user.email) {
        return Results.error('User not found or invalid token');
      }

      const result = await this.googleService.unregisterCalendar(user.email);
      return Results.success(result);
    } catch (error) {
      return Results.error(error);
    }
  }

  @Get('meetings')
  @UseGuards(JwtAccessTokenGuard)
  async getUserMeetings(
    @Req() req: RequestWithUser,
    @Query('today') today: boolean,
  ) {
    try {
      const user = req.user;

      if (!user || !user.email) {
        return Results.error('User not found or invalid token');
      }

      return await this.googleService.getUserMeetings(user.email, today);
    } catch (error) {
      return Results.error(error);
    }
  }
}
