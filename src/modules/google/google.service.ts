import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { google } from 'googleapis';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { GuardConfigurationInfo } from 'src/configs/config.interface';
import { Page } from 'puppeteer';
import { EventsGateway } from '@modules/gateways/events.gateway';
import { Meeting } from '@database/entities/meeting.entity';
import { JOINING_STATUS } from 'src/shared/enum';
import { UserAccountService } from '@modules/user-account/services/user-account.service';
import * as jwt from 'jsonwebtoken';
import { AgendaService } from '@modules/queue/agenda.service';
import { MeetingCalendarDto } from '@modules/queue/dto/meetingCarlendar.dto';
import { convertToUTC } from 'src/shared/constants/global.constants';
import { Results } from 'src/base/response/result-builder';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  private readonly calendar = google.calendar('v3');
  private clientId: string;
  private clientSecret: string;
  private readonly googleMeetBaseUrl: string = 'https://meet.google.com/';

  constructor(
    private readonly httpService: HttpService,
    private readonly _userAccountService: UserAccountService,
    configService: ConfigService,
    private readonly eventGateway: EventsGateway,
    private readonly agendaService: AgendaService,
  ) {
    this.clientId =
      configService.getOrThrow<GuardConfigurationInfo>('google').clientId;
    this.clientSecret =
      configService.getOrThrow<GuardConfigurationInfo>('google').clientSecret;
  }

  async watchCalendar(
    accessToken: string,
    refreshToken: string,
    calendarId: string,
    email: string,
    domainUrl: string,
  ) {
    try {
      const user = await this._userAccountService.get({
        email,
      });
      if (!user) {
        return false;
      }
      await this.unregisterCalendar(email);
      const channel = {
        id: randomUUID(),
        type: 'web_hook',
        address: `${domainUrl}/google/notifications/${email}`, // Endpoint nhận thông báo
      };
      const watch = await this.calendar.events.watch({
        oauth_token: accessToken,
        calendarId,
        requestBody: channel,
      });
      await this._userAccountService.update(
        { email },
        {
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          googleChannelId: watch.data.id,
          resourceId: watch.data.resourceId,
        },
      );

      this.logger.log('Webhook đăng ký thành công:');
      return true;
    } catch (error) {
      throw new InternalServerErrorException('Server error');
    }
  }

  async unregisterCalendar(email: string) {
    try {
      const user = await this._userAccountService.get({ email });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      let { googleAccessToken, googleRefreshToken } = user;
      if (!user.googleAccessToken || !user.googleRefreshToken) {
        return null;
      }
      if (this.isTokenExpired(googleAccessToken)) {
        googleAccessToken = await this.refreshAccessToken(googleRefreshToken);
      }

      await this.stopCalendarWebhook(
        user.googleChannelId,
        user.resourceId,
        googleAccessToken,
      );

      const cancelResult = await this.agendaService.cancelAllUserMeetings(
        user.id,
      );
      this.logger.log(
        `✅ Đã hủy agenda jobs: ${cancelResult.canceledCount} jobs`,
      );

      await this._userAccountService.update(
        { email },
        {
          googleAccessToken: null,
          googleRefreshToken: null,
          googleChannelId: null,
          resourceId: null,
        },
      );

      this.logger.log(`✅ Đã hủy đăng ký calendar cho email: ${email}`);

      return {
        success: true,
        message: 'Đã hủy đăng ký calendar thành công',
        canceledAgendaJobs: cancelResult.canceledCount,
        canceledQueueJobs: cancelResult.canceledQueueJobs || 0,
      };
    } catch (error) {
      this.logger.error(`❌ Lỗi khi hủy đăng ký calendar: ${error.message}`);
      throw new InternalServerErrorException('Lỗi khi hủy đăng ký calendar');
    }
  }

  private async stopCalendarWebhook(
    channelId: string,
    resourceId: string,
    accessToken: string,
  ) {
    try {
      await this.calendar.channels.stop({
        oauth_token: accessToken,
        requestBody: {
          id: channelId,
          resourceId: resourceId,
        },
      });

      this.logger.log(`✅ Đã hủy webhook calendar`);
    } catch (error) {
      this.logger.warn(`⚠️ Không thể hủy webhook calendar: ${error.message}`);
    }
  }

  async getEvents(email: string, calendarId?: string) {
    try {
      let { googleAccessToken, googleRefreshToken, id } =
        await this._userAccountService.get({ email });
      if (!googleAccessToken || !googleRefreshToken) {
        return false;
      }
      if (this.isTokenExpired(googleAccessToken)) {
        googleAccessToken = await this.refreshAccessToken(googleRefreshToken);
        await this._userAccountService.update(
          { email },
          { googleAccessToken: googleAccessToken },
        );
      }
      const events = await this.calendar.events.list({
        oauth_token: googleAccessToken,
        calendarId: calendarId || 'primary',
        timeMin: new Date().toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      const eventMeetings = events.data.items.filter((f) => f.hangoutLink);
      await this.agendaService.cancelAllUserMeetings(id);
      if (eventMeetings.length) {
        await this.agendaService.scheduleMeetings(
          id,
          eventMeetings.map((event) => ({
            id: event.id,
            summary: event.summary,
            start: event.start,
            end: event.end,
            hangoutLink: event.hangoutLink,
            organizer: event.organizer,
          })) as MeetingCalendarDto[],
        );
        this.eventGateway.handlePingGoogleCalendar(id);
      }
      return eventMeetings;
    } catch (error) {
      this.logger.error('Lỗi khi lấy events:', error);
      return false;
    }
  }

  async getUserMeetings(email: string, today: boolean = false) {
    try {
      // 1. Kiểm tra user có đăng ký Google Calendar không
      const user = await this._userAccountService.get({ email });
      if (!user) {
        return Results.error('User not found');
      }

      // 2. Kiểm tra có token Google không
      if (!user.googleAccessToken || !user.googleRefreshToken) {
        return Results.success({
          registerGoogleCalendar: false,
          message: 'Chưa đăng ký Google Calendar',
        });
      }

      // 3. Lấy danh sách events từ Google Calendar
      let { googleAccessToken, googleRefreshToken } = user;

      // Refresh token nếu cần
      if (this.isTokenExpired(googleAccessToken)) {
        googleAccessToken = await this.refreshAccessToken(googleRefreshToken);
        await this._userAccountService.update(
          { email },
          { googleAccessToken: googleAccessToken },
        );
      }

      // Tính toán thời gian cho query
      const now = new Date();
      const timeMin = now.toISOString();

      let timeMax;
      if (today) {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        timeMax = endOfDay.toISOString();
      }

      const events = await this.calendar.events.list({
        oauth_token: googleAccessToken,
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      // 4. Lọc và format events có hangoutLink
      const eventMeetings = events.data.items
        .filter((event) => event.hangoutLink)
        .map((event) => ({
          platform: 'google',
          summary: event.summary || 'Không có tiêu đề',
          startTime: convertToUTC(event.start.dateTime, event.start.timeZone),
          hangoutLink: event.hangoutLink,
          eventId: event.id,
        }));

      return Results.success({
        registerGoogleCalendar: true,
        list: eventMeetings,
        total: eventMeetings.length,
      });
    } catch (error) {
      return Results.error(error);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await this.httpService.axiosRef.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    );

    return response.data.access_token;
  }

  isTokenExpired(accessToken: string): boolean {
    try {
      const decoded = jwt.decode(accessToken) as { exp: number };
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  async createGoogleMeetEvent(accessToken: string) {
    const calendar = google.calendar({ version: 'v3' });
    const event = {
      summary: 'Google Meet Event',
      location: 'Online',
      description: 'Test Google Meet Event',
      start: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
      end: {
        dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: 'sample123',
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const res = await calendar.events.insert({
      oauth_token: accessToken,
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    return res;
  }

  async exchangeCodeForToken(code: string) {
    try {
      const data = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: 'http://localhost:8911/api/v1/google/redirect',
        grant_type: 'authorization_code',
      });

      const response = await firstValueFrom(
        this.httpService.post(
          'https://oauth2.googleapis.com/token',
          data.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      console.log('response', response);

      return response.data;
    } catch (error) {
      console.log('error', error);
    }
  }

  async convertUrlGoogleAuth(
    redirect_uri: string,
    backend_redirect_uri: string,
  ): Promise<string> {
    const customState = encodeURIComponent(
      JSON.stringify({
        redirect_uri,
      }),
    );
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${backend_redirect_uri}&scope=email profile&response_type=code&state=${customState}`;
    return googleAuthUrl;
  }

  async verifyGoogleAccessToken(accessToken: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      return response.data;
    } catch (error) {
      throw new UnauthorizedException('Invalid Google access token');
    }
  }
  async autoJoin(page: Page, meetingCode: string, meetingId: string) {
    try {
      // await this.loginAccountGoole(page);
      await page.goto(`${this.googleMeetBaseUrl}${meetingCode}?hl=en`, {
        waitUntil: 'networkidle2',
        timeout: 1000 * 2 * 60,
      });

      //waiting popup show
      try {
        await page.waitForSelector('div[jsname="Qx7uuf"]', { timeout: 10000 });
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }
      try {
        //check show popup "Continue without microphone and camera"
        await page.waitForSelector('div[jsname="rZHESd"]', { timeout: 5000 });
        //close popup
        await page.$$eval('span[jsname="V67aGc"].mUIrbf-vQzf8d', (buttons) => {
          const targetButton = buttons.find((button) =>
            ['Not now', 'Continue without microphone and camera'].includes(
              button.innerText.trim(),
            ),
          );

          if (targetButton) {
            targetButton.scrollIntoView();
            targetButton.click();
          }
        });
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }

      try {
        await page.waitForSelector('div[jscontroller="Zh2ste"]', {
          timeout: 5000,
        });
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }
      //typing name
      await page.type('input[type="text"]', 'AI meeting Bot', {
        delay: 100,
      });

      // click to button join
      await page.$eval('button[data-promo-anchor-id="w5gBed"]', (button) => {
        button.scrollIntoView();
        button.click();
      });

      // push socket
      this.eventGateway.handleJoiningMeeting(
        meetingId,
        JOINING_STATUS.WATING_FOR_ADMIT,
      );
      // push socket

      await page.waitForSelector('div[jscontroller="h8UR3d"]', {
        timeout: 1000 * 60,
      });

      await page.$eval(
        'button[jsname="A5il2e"][data-promo-anchor-id="GEUYHe"]',
        async (button) => {
          button.scrollIntoView();
          button.click();
        },
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await page.$eval(
        'button[jsname="A5il2e"][aria-label="Chat with everyone"]',
        async (button) => {
          button.scrollIntoView();
          button.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
          button.click();
        },
      );

      const meetingHostData = await page.evaluate(() => {
        let organizer = null;
        let participants = [];

        const containers = document.querySelectorAll(
          'div.zSX24d[jsname="mu2b5d"]',
        );
        for (const container of containers) {
          const label = container.querySelector('div.d93U2d.qrLqp');
          const nameSpan = container.querySelector('span.zWGUib');
          const joiningLabel = container.querySelector('span.NnTWjc');
          if (nameSpan) {
            if (joiningLabel?.textContent?.trim() !== '(You)')
              participants.push(nameSpan.textContent.trim());
            if (label && label.textContent === 'Meeting host') {
              organizer = nameSpan.textContent.trim();
            }
          }
        }
        return { organizer, participants };
      });

      try {
        await page.waitForSelector('button[jsname="EszDEe"]', {
          timeout: 1000 * 3,
        });
        await page.$eval('button[jsname="EszDEe"]', async (button) => {
          button.scrollIntoView();
          button.click();
        });
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      return meetingHostData;
    } catch (error) {
      this.eventGateway.handleJoiningMeeting(meetingId, JOINING_STATUS.FAILED);
      throw new BadRequestException(error);
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

  async handleWatchDom(
    page: Page,
    getAbsoluteTime: () => number,
    meet: Meeting,
    setMessage: (val: { sender: string; message: string }) => void,
    setUsers: (val: string[]) => void,
    observer: MutationObserver,
    stopBot: () => void,
  ) {
    await page.exposeFunction(
      'handlePingChat',
      (chatMessage: { sender: string; message: string }) => {
        this.eventGateway.handlePingChat(
          { ...chatMessage, time: getAbsoluteTime() },
          meet.id,
        );
        setMessage(chatMessage);
      },
    );
    await page.exposeFunction('participantOnchange', (value: number) => {
      this.eventGateway.handlePingParticipant({ participant: value }, meet.id);
      if (value <= 1) {
        stopBot();
      }
    });

    await page.exposeFunction('handleListUsers', (users: string[]) => {
      setUsers(users);
    });

    return await page.evaluate(() => {
      observer = new MutationObserver((mutationsList) => {
        let stop = false;
        for (const mutation of mutationsList) {
          if (stop) {
            break;
          }
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node instanceof HTMLElement) {
                const messageElement =
                  node.closest('div[jsname="Ypafjf"]') ||
                  node.querySelector('div[jsname="Ypafjf"]');
                if (messageElement) {
                  const senderDiv = messageElement.querySelector('div.HNucUd');
                  const senderName = senderDiv
                    ? senderDiv.querySelector('div.poVWob')?.textContent.trim()
                    : null;
                  const messageDiv = messageElement.querySelector('div.beTDc');
                  const message = messageDiv
                    ? messageDiv.lastElementChild?.textContent?.trim()
                    : null;

                  const chatMessage = {
                    sender: senderName,
                    message: message,
                  };
                  if (chatMessage.sender && chatMessage.message) {
                    stop = true;
                    window.handlePingChat(chatMessage);
                    break;
                  }
                }
              }
            }
          }

          if (mutation.type === 'characterData') {
            const participantCount = mutation?.target?.textContent?.trim() || 0;
            window.participantOnchange(Number(participantCount));
            if (!participantCount) {
              stop = true;
              break;
            }
            const participants = [];
            document
              .querySelectorAll('div.zSX24d[jsname="mu2b5d"]')
              .forEach((node) => {
                const nameSpan = node.querySelector('span.zWGUib');
                const joiningLabel = node.querySelector('span.NnTWjc');
                if (nameSpan) {
                  if (joiningLabel?.textContent?.trim() !== '(You)')
                    participants.push(nameSpan.textContent.trim());
                }
              });
            window.handleListUsers(participants);
          }
          const peopleElement = document.querySelector(
            'div[jscontroller="SKibOb"]',
          );
          if (!peopleElement) {
            window.participantOnchange(0);
            stop = true;
            break;
          }
        }
      });
      const container = document.querySelector('div[jsname="xySENc"]');

      const peopleContainer = document.querySelector(
        'div[jscontroller="SKibOb"]',
      );

      if (container) {
        observer.observe(container, { childList: true, subtree: true });
      } else {
        console.error('Container not found');
      }

      if (peopleContainer) {
        observer.observe(peopleContainer, {
          characterData: true,
          childList: true,
          subtree: true,
        });
      } else {
        console.error('People container not found');
      }

      const targetSelector = 'div.VfPpkd-P5QLlc[role="dialog"]';
      const targetSelectorModal = 'div.VfPpkd-IE5DDf[jsname="GGAcbc"]';

      const hidePopupIfExists = () => {
        const popup = document.querySelector(targetSelector);
        const popupModal = document.querySelector(targetSelectorModal);
        if (popup) (popup as HTMLElement).style.display = 'none';
        if (popupModal) (popupModal as HTMLElement).style.display = 'none';
      };

      hidePopupIfExists();

      const observerPopup = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (
                element.matches?.(targetSelector) ||
                element.matches?.(targetSelectorModal)
              ) {
                element.style.display = 'none';
              }
            }
          }
        }
      });

      observerPopup.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
}
