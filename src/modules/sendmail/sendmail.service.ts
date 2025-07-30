import { BadRequestException, Injectable } from '@nestjs/common';
import { configDotenv } from 'dotenv';
import { SendMailDto } from './dto/sendmail.dto';
import { createTransport } from 'nodemailer';
configDotenv();

@Injectable()
export class SendmailService {
  constructor() {}
  async sendmail(sendMail: SendMailDto): Promise<string> {
    const env = process.env;
    // const transporter = createTransport({
    //   host: env.SMTP_HOST,
    //   port: Number(env.SMTP_PORT),
    //   secure: false,
    //   auth: {
    //     user: env.SMTP_USER,
    //     pass: env.SMTP_PASSWORD,
    //   },
    // });

    const transporter = createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: env.SMTP_USER,
        clientId: env.SMTP_CLIENT_ID,
        clientSecret: env.SMTP_CLIENT_SECRET,
        refreshToken: env.SMTP_REFRESH_TOKEN,
        accessToken: env.SMTP_ACCESS_TOKEN,
      },
    });

    const mailOptions = {
      from: `"MeetLyzer" <${env.SMTP_SENDER}>`,
      to: sendMail.sendTo,
      subject: sendMail.subject,
      html: sendMail.content,
    };
    try {
      const res = await transporter.sendMail(mailOptions);
      return res.response;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }
}
