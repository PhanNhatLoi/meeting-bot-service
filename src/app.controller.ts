import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { Public } from './base/decorators/auth.decorator';

@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('redirect')
  redirect(
    @Query('redirectUri') redirectUri: string,
    @Query('email') email: string,
    @Query('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    const finalUrl = `${redirectUri}reset-password?email=${email}&accessKey=${accessKey}`;
    return res.redirect(finalUrl);
  }
}
