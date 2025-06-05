import { BadRequestException, Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { EventsGateway } from '@modules/gateways/events.gateway';
import { Meeting } from '@database/entities/meeting.entity';
import { JOINING_STATUS } from 'src/shared/enum';

@Injectable()
export class ZoomService {
  private readonly zoomMeetBaseUrl = 'https://zoom.us/j/';

  constructor(private readonly eventGateway: EventsGateway) {}

  async autoJoin(
    page: Page,
    meetingCode: string,
    params: string,
    meetingId: string,
  ) {
    try {
      await page.goto(
        `${this.zoomMeetBaseUrl}${meetingCode}${params ? '?' + params : ''}#success`,
        { waitUntil: 'networkidle2', timeout: 1000 * 2 * 60 },
      );

      await page.waitForSelector('div[role="button"].mbTuDeF1', {
        timeout: 1000 * 2 * 60,
      });

      await page.$eval('div[role="button"].mbTuDeF1', (button) => {
        button.scrollIntoView();
        button.click();
      });

      await page.waitForSelector('a[web_client][role="button"]');
      await page.$eval('a[web_client][role="button"]', (button) => {
        button.scrollIntoView();
        button.click();
      });

      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      const frames = page.frames();
      const zoomFrame = frames
        .find((frame) => frame?.url().includes(meetingCode))
        ?.url()
        .replace('fromPWA=1&', '');

      await page.goto(zoomFrame, {
        waitUntil: 'networkidle2',
        timeout: 1000 * 2 * 60,
      });

      await page.evaluate(() => {
        const input = document.querySelector('#input-for-name');
        if (input) {
          input.setAttribute('value', 'Zens bot');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await page.$eval('button[type="button"]', (button) => {
        button.click();
      });

      // push socket
      this.eventGateway.handleJoiningMeeting(
        meetingId,
        JOINING_STATUS.WATING_FOR_ADMIT,
      );
      // push socket

      await new Promise((resolve) => setTimeout(resolve, 5000));
      await page.waitForSelector('#wc-footer', { timeout: 1000 * 60 });

      await page.waitForSelector('#participant', { timeout: 5000 });
      const buttonHandle = await page.$('#participant button[type="button"]');

      if (buttonHandle) {
        await buttonHandle.evaluate((button) => {
          button.scrollIntoView();
          button.click();
        });
      }

      try {
        await page.$eval('#wc-container-right', (element) => {
          (element as HTMLElement).style.opacity = '0';
          (element as HTMLElement).style.position = 'absolute';
        });

        await page.evaluate(() => {
          const target = document.querySelector(
            '.speaker-bar-container__horizontal-view-wrap',
          );
          const wrapper = target?.parentElement;
          if (wrapper && wrapper instanceof HTMLElement) {
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';
            wrapper.style.flexDirection = 'column';
          }
        });
      } catch (error) {
        if (error.name !== 'TimeoutError') {
          throw new BadRequestException(error);
        }
      }

      const meetingHostData = await page.evaluate(() => {
        let organizer = null;
        let participants = [];

        const containers = document.querySelectorAll(
          'div.participants-item__item-layout',
        );
        for (const container of containers) {
          const label = container.querySelector(
            'span.participants-item__name-label',
          );
          const nameSpan = container.querySelector(
            'span.participants-item__display-name',
          );

          const joiningLabel = container.querySelector(
            'div.participants-item__right-section',
          );

          if (nameSpan) {
            if (
              !label ||
              (label.textContent.trim() !== '(Me)' &&
                !joiningLabel?.textContent?.trim())
            )
              participants.push(nameSpan.textContent.trim());
            if (label && label.textContent === ' (Host)') {
              organizer = nameSpan.textContent.trim();
            }
          }
        }
        return { organizer, participants };
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.handleOpenChat(page);

      return meetingHostData;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async handleOpenChat(page: Page) {
    try {
      const pannel = await page.$('#chat-list-content');
      if (!pannel) {
        await page.$eval(
          'button[aria-label="open the chat panel"]',
          async (button) => {
            button.scrollIntoView();
            button.click();
          },
        );
      }
    } catch (error) {
      if (error.name !== 'TimeoutError') {
        throw new BadRequestException(error);
      }
    }
    try {
      const pannel = await page.$('#participants-ul');

      if (!pannel) {
        const buttonHandle = await page.$('#participant button[type="button"]');
        if (buttonHandle) {
          await buttonHandle.evaluate((button) => {
            button.scrollIntoView();
            button.click();
          });
        }
      }
    } catch (error) {
      if (error.name !== 'TimeoutError') {
        throw new BadRequestException(error);
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

    await page.exposeFunction('handleOpenChat', async () => {
      await this.handleOpenChat(page);
    });

    await page.exposeFunction('handleListUsers', (users: string[]) => {
      setUsers(users);
    });

    return await page.evaluate(() => {
      const seenMessages = new Set();
      let senderName = '';
      const bodyElement = document.body;

      observer = new MutationObserver((mutationsList) => {
        let stop = 0;
        for (const mutation of mutationsList) {
          if (stop) break;
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node instanceof HTMLElement) {
                const messageElement =
                  node.closest('div[class="chat-item-position"]') ||
                  node.querySelector('div[class="chat-item-position"]');

                if (messageElement) {
                  const wrapperElement = messageElement.closest('div[id]');
                  const messageId = wrapperElement?.id;

                  if (!messageId || seenMessages.has(messageId)) {
                    stop = 1;
                    break;
                  }

                  seenMessages.add(messageId);
                  const senderDiv = messageElement.querySelector(
                    'div.new-chat-item__chat-info-header',
                  );
                  senderName =
                    (senderDiv &&
                      senderDiv
                        .querySelector('div.chat-item__left-container')
                        ?.querySelector('[data-name]')
                        ?.getAttribute('data-name')) ||
                    senderName;

                  // Lấy nội dung tin nhắn
                  const messageDiv = messageElement.querySelector(
                    'div.new-chat-item__chat-msg-wrap',
                  );
                  const message = messageDiv
                    ? messageDiv
                        .querySelector('.new-chat-message__content')
                        ?.textContent?.trim()
                    : null;

                  if (message) {
                    const chatMessage = {
                      sender: senderName,
                      time: Date.now(),
                      message: message,
                    };

                    window.handlePingChat(chatMessage);
                  }
                }

                const modalContainer = node.querySelector(
                  'div.zm-modal.zm-modal-legacy',
                );

                if (modalContainer) {
                  stop = 1;
                  window.participantOnchange(0);
                }
              }
            }
          }

          if (mutation.type === 'characterData') {
            const participantCount = mutation?.target?.textContent?.trim() || 0;
            window.participantOnchange(Number(participantCount || 0));
            const participants = [];
            document
              .querySelectorAll('div.participants-item__item-layout')
              .forEach((node) => {
                const roleLabel = node.querySelector(
                  'span.participants-item__name-label',
                );
                const nameLabel = node.querySelector(
                  'span.participants-item__display-name',
                );

                const joiningLabel = node.querySelector(
                  'div.participants-item__right-section',
                );

                if (
                  nameLabel &&
                  roleLabel.textContent.trim() !== '(Me)' &&
                  !joiningLabel?.textContent?.trim()
                ) {
                  participants.push(nameLabel.textContent?.trim() || '');
                }
              });

            window.handleListUsers(participants);
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      // Tìm phần tử container và theo dõi nó

      const observeContainer = () => {
        const container = document.querySelector('div#chat-list-content');
        if (container) {
          observer.observe(container, { childList: true, subtree: true });
        } else {
          console.error('Container not found, retrying...');
          setTimeout(observeContainer, 1000);
        }
        const peopleContainer = document.querySelector('div#participant');

        if (peopleContainer) {
          observer.observe(peopleContainer, {
            characterData: true,
            childList: true,
            subtree: true,
          });
        } else {
          console.error('People container not found');
        }
      };

      observeContainer();

      // Body Observer để đảm bảo container tồn tại
      const bodyObserver = new MutationObserver(() => {
        if (!observer && bodyObserver) {
          bodyObserver.disconnect();
        }
        const chatContainer = document.querySelector('div#chat-list-content');
        const participantContainer = document.querySelector(
          'div#participants-ul',
        );
        if (!chatContainer || !participantContainer) {
          window.handleOpenChat();
          observeContainer();
        }
      });

      bodyObserver.observe(bodyElement, { childList: true, subtree: true });
    });
  }
}
