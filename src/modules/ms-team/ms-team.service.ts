import { BadRequestException, Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { EventsGateway } from '@modules/gateways/events.gateway';
import { Meeting } from '@database/entities/meeting.entity';
import { JOINING_STATUS } from 'src/shared/enum';

@Injectable()
export class MsTeamService {
  private readonly msTeamMeetBaseUrl = 'https://teams.live.com/meet/';
  constructor(private readonly eventGateway: EventsGateway) {}

  async autoJoin(
    page: Page,
    meetingCode: string,
    params: string,
    meetingId: string,
  ) {
    try {
      await page.goto(
        `${this.msTeamMeetBaseUrl}${meetingCode}${params ? '?' + params : ''}`,
        { waitUntil: 'networkidle2', timeout: 1000 * 2 * 60 },
      );

      try {
        await page.waitForSelector('button[data-tid="joinOnWeb"]', {
          timeout: 3000,
        });
        await page.$eval('button[data-tid="joinOnWeb"]', (button) => {
          button.scrollIntoView();
          button.click();
        });
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await page.waitForSelector(
        'input[data-tid="prejoin-display-name-input"]',
        { visible: true },
      );

      await page.type(
        'input[data-tid="prejoin-display-name-input"]',
        'Zens bot',
        { delay: 100 },
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      await page.click('#prejoin-join-button');

      // push socket
      this.eventGateway.handleJoiningMeeting(
        meetingId,
        JOINING_STATUS.WATING_FOR_ADMIT,
      );
      // push socket

      try {
        await page.waitForSelector('button[aria-label="Close"]', {
          timeout: 3000,
        });

        await page.click('button[aria-label="Close"]');
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }

      await page.waitForSelector('div[data-tid="ubar-toolbar-wrapper"]', {
        timeout: 1000 * 2 * 60,
      });

      try {
        await page.waitForSelector('div[data-severity="Critical"]', {
          timeout: 3000,
        });

        await page.click('#close_button');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await page.click('#close_button');

        await page.waitForSelector('button#roster-button', {
          timeout: 1000 * 2 * 60,
        });
        await page.$eval('button#roster-button', async (button) => {
          button.click();
        });

        await page.waitForSelector('div[data-cid="roster-participant"]', {
          timeout: 1000 * 60,
        });

        const meetingHostData = await page.evaluate(() => {
          let organizer = null;
          let participants = [];
          const containers = document.querySelectorAll(
            'div[data-cid="roster-participant"]',
          );
          for (const container of containers) {
            const hostLabel = container.querySelector(
              'span[data-tid="ts-roster-organizer-status"]',
            );
            const nameSpan = container.querySelector(
              'div.fui-TreeItemPersonaLayout__main',
            );
            const guestNameSpan = container.querySelector(
              'span.fui-StyledText.___1v3qvzg',
            );
            if (nameSpan?.textContent) {
              if (hostLabel && hostLabel.textContent === 'Organizer') {
                organizer = nameSpan?.textContent;
                participants.push(nameSpan?.textContent.trim());
              } else {
                if (
                  guestNameSpan?.textContent &&
                  !['Zens bot', 'Unknown User'].includes(
                    guestNameSpan?.textContent?.trim(),
                  )
                ) {
                  participants.push(guestNameSpan?.textContent.trim());
                }
              }
            }
          }
          return { organizer, participants };
        });
        return meetingHostData;
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }

      return { organizer: null };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async handleOpenModal(page: Page, modalName: 'chat' | 'participant') {
    if (modalName === 'chat') {
      const element = await page.$('#message-pane-layout-a11y');
      if (!element) {
        await page.waitForSelector('button#chat-button', {
          timeout: 1000 * 2 * 60,
        });
        await page.$eval('button#chat-button', async (button) => {
          button.click();
        });
      }
    }
    if (modalName === 'participant') {
      const element = await page.$(
        'div[data-tid="calling-right-side-panel"][aria-label="Participants"]',
      );
      if (!element) {
        await page.waitForSelector('button#roster-button', {
          timeout: 1000 * 2 * 60,
        });
        await page.$eval('button#roster-button', async (button) => {
          button.click();
        });
      }
    }
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
    await this.handleOpenModal(page, 'chat');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const pannel = await page.$('div[data-tid="app-layout-area--end"]');
    if (pannel) {
      await page.$eval('div[data-tid="app-layout-area--end"]', (element) => {
        (element as HTMLElement).style.opacity = '0';
        (element as HTMLElement).style.position = 'absolute';
      });
    }
    await page.exposeFunction(
      'handlePingChat',
      (chatMessage: { sender: string; time: number; message: string }) => {
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

    await page.exposeFunction('handleListUsers', async () => {
      await this.handleOpenModal(page, 'participant');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await page.evaluate(() => {
        const containers = document.querySelectorAll(
          'div[data-cid="roster-participant"]',
        );
        const result = [];

        for (const container of containers) {
          const hostLabel = container.querySelector(
            'span[data-tid="ts-roster-organizer-status"]',
          );
          const nameSpan = container.querySelector(
            'div.fui-TreeItemPersonaLayout__main',
          );
          const guestNameSpan = container.querySelector(
            'span.fui-StyledText.___1v3qvzg',
          );

          if (nameSpan?.textContent) {
            if (hostLabel && hostLabel.textContent === 'Organizer') {
              result.push(nameSpan.textContent.trim());
            } else {
              if (
                guestNameSpan?.textContent &&
                !['Zens bot', 'Unknown User'].includes(
                  guestNameSpan.textContent.trim(),
                )
              ) {
                result.push(guestNameSpan.textContent.trim());
              }
            }
          }
        }

        return result;
      });
      setUsers(res);
      await this.handleOpenModal(page, 'chat');
    });

    return await page.evaluate(() => {
      const processedMessages = new Set();
      const bodyElement = document.body;

      observer = new MutationObserver(async (mutationsList) => {
        let stop = 0;
        for (const mutation of mutationsList) {
          if (stop) {
            break;
          }
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node instanceof HTMLElement) {
                const messageElement = node.closest(
                  'div[data-tid="chat-pane-item"]',
                );
                if (messageElement && !processedMessages.has(messageElement)) {
                  const sender = messageElement
                    .querySelector('span[data-tid="message-author-name"]')
                    ?.textContent?.trim();

                  const messageDiv = messageElement.querySelector(
                    'div[data-tid="chat-pane-message"]',
                  );
                  const message = messageDiv?.textContent.trim() || '';

                  if (message && sender) {
                    const chatMessage = {
                      sender: sender,
                      time: Date.now(),
                      message: message,
                    };
                    window.handlePingChat(chatMessage);
                    processedMessages.add(messageElement);
                  }
                } else {
                  stop = 1;
                  break;
                }
              }
            }
          }

          if (mutation.type === 'characterData') {
            window.handleListUsers([]);
          }
        }

        const peopleElement = document.querySelector(
          'span[data-tid="roster-button-tile"]',
        );
        if (!peopleElement) {
          window.participantOnchange(0);
        }
      });

      const peopleContainer = document.querySelector('button#roster-button');
      const mainContainer = document.querySelector(
        'div[data-tid="app-layout-area--main"]',
      );

      if (peopleContainer) {
        observer.observe(peopleContainer, {
          characterData: true,
          childList: true,
          subtree: true,
        });
      }

      if (mainContainer) {
        observer.observe(mainContainer, { childList: true, subtree: true });
      }
      //
      const observeContainer = () => {
        const chatContainer = document.querySelector('div#chat-pane-list');
        if (chatContainer) {
          observer.observe(chatContainer, { childList: true, subtree: true });
        } else {
          console.error('Chat container not found');
        }
      };

      observeContainer();

      // Body Observer để đảm bảo container tồn tại
      const bodyObserver = new MutationObserver(() => {
        if (!observer && bodyObserver) {
          bodyObserver.disconnect();
        }
        const chatContainer = document.querySelector('div#chat-pane-list');
        if (chatContainer) {
          observeContainer();
        }
      });

      bodyObserver.observe(bodyElement, { childList: true, subtree: true });

      //
    });
  }
}
