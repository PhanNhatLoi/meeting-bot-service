import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';
import { Public } from 'src/base/decorators/auth.decorator';

@Public()
@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

  @Get('register-calendar')
  @UseGuards(GoogleAuthGuard)
  async watchCalendar(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, systemEmail } = req.user;
      const calendarId = 'primary';

      await this.googleService.watchCalendar(
        accessToken,
        refreshToken,
        calendarId,
        systemEmail,
      );
      return res.send(`
      <script>
        window.opener.postMessage({ success: true, error:null }, "*");
        window.close();
      </script>
    `);
    } catch (error) {
      return res.send(`
      <script>
        window.opener.postMessage({ success: false, error: "OAuth failed" }, "*");
        window.close();
      </script>
    `);
    }
  }

  // Endpoint nhận thông báo
  @Post('notifications/:email')
  async handleNotifications(
    @Req() req,
    @Res() res,
    @Param('email') email: string,
  ) {
    console.log('Nhận thông báo từ Google: cho email ', email);
    this.googleService.getEvents(email, 'primary');
    res.status(200).send('OK');
  }
}
