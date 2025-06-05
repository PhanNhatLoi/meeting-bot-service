import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'puppeteer';
import { IEmailAccount } from 'src/configs/config.interface';

@Injectable()
export class EventsService {
  private readonly emailUserName: string;
  private readonly emailPassword: string;
  constructor(configService: ConfigService) {
    this.emailUserName =
      configService.getOrThrow<IEmailAccount>('emailAccount').username;
    this.emailPassword =
      configService.getOrThrow<IEmailAccount>('emailAccount').password;
  }
  async joinGoogleMeet(meetLink: string, page: Page) {
    try {
      await page.goto('https://accounts.google.com/', {
        waitUntil: 'networkidle2',
      });

      await page.type('input[type="email"]', this.emailUserName, {
        delay: 100,
      });
      await page.click('#identifierNext');

      await page.waitForSelector('input[type="password"]', { visible: true });
      await page.type('input[type="password"]', this.emailPassword, {
        delay: 100,
      });
      await page.click('#passwordNext');

      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      await page.goto(`${meetLink}?hl=en`, {
        waitUntil: 'networkidle2',
        timeout: 1000 * 2 * 60,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await page.waitForSelector('span[jsname="V67aGc"].mUIrbf-vQzf8d');

      await page.$$eval('span[jsname="V67aGc"].mUIrbf-vQzf8d', (buttons) => {
        const targetButton = buttons.find((button) =>
          ['Not now', 'Continue without microphone and camera'].includes(
            button.innerText.trim(),
          ),
        );

        if (targetButton) {
          targetButton.scrollIntoView();
          targetButton.click();
        } else {
          throw new Error('Không tìm thấy nút "Not now"!');
        }
      });

      await page.waitForSelector('span[class="UywwFc-vQzf8d"]');
      await page.$eval('span[class="UywwFc-vQzf8d"]', (button) => {
        button.scrollIntoView();
        button.click();
      });

      await page.waitForSelector('div[jscontroller="h8UR3d"]', {
        timeout: 1000 * 60,
      });

      await page.$eval(
        'button[jsname="A5il2e"][aria-label="Chat with everyone"]',
        async (button) => {
          button.scrollIntoView();
          button.click();
          await new Promise((resolve) => setTimeout(resolve, 300));
          button.click();
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      // throw new BadRequestException(error);
    }
  }

  async getChatGoogleMeet(page: Page) {
    return await page.$$eval('div[jsname="Ypafjf"]', (messageElements) => {
      return messageElements.map((element) => {
        const senderDiv = element.querySelector('div.HNucUd');

        const senderName = senderDiv
          ? senderDiv.querySelector('div.poVWob')?.textContent.trim()
          : null;

        const senderTime = senderDiv
          ? senderDiv.querySelector('div.MuzmKe')?.textContent.trim()
          : null;

        const messageDiv = element.querySelector('div.beTDc');
        const messageContent = messageDiv
          ? Array.from(messageDiv.children).map((child: any) =>
              child.textContent?.trim(),
            )
          : [];

        return {
          sender: senderName,
          time: senderTime,
          messages: messageContent,
        };
      });
    });
  }
}
