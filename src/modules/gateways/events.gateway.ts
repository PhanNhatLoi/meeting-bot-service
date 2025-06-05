import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import {
  JOINING_STATUS,
  SUMMARY_CORE,
  TRANSLATE_STATUS,
} from 'src/shared/enum';
import { UserSubcription } from '@database/entities/user-subcription.entity';
import { Translation } from '@database/entities/translation.entity';
const prefixChanel = 'user_client_';

@WebSocketGateway({ cors: { origin: '*', credentials: true } })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  constructor(private readonly _eventService: EventsService) {}

  afterInit(server: Server) {}

  @SubscribeMessage('user-connection')
  async handleUserConnection(
    client: Socket,
    payload: { userId: string },
  ): Promise<void> {
    try {
      client.join(`${prefixChanel}${payload.userId}`);
    } catch (error) {
      console.log(error);
    }
  }

  handleConnection(client: Socket, ...args: any[]) {}

  async handleDisconnect(client: Socket) {}

  async handlePingChat(
    data: {
      sender: string;
      message: string;
      time?: number;
    },
    meetingId?: string,
  ) {
    try {
      this.server.emit(`${meetingId}_chat`, data);
    } catch (error) {
      console.log(error);
    }
  }

  async handlePingParticipant(
    data: { participant: number },
    meetingId?: string,
  ) {
    try {
      this.server.emit(`${meetingId}_participant`, data);
    } catch (error) {
      console.log(error);
    }
  }

  async handlePingTranslation(
    userId: string,
    meetingId: string,
    data: { status: TRANSLATE_STATUS; transcripts: Translation[] },
  ) {
    try {
      this.server.emit(`${meetingId}_translation`, data);
      this.server
        .to(`${prefixChanel}${userId}`)
        .emit('translation_status', { meetingId, ...data });
    } catch (error) {
      console.log(error);
    }
  }

  async handlePingSummary(
    userId: string,
    meetingId: string,
    data: { summaryCore: SUMMARY_CORE; summary: string },
  ) {
    try {
      this.server.emit(`${meetingId}_summary`, data);
      this.server
        .to(`${prefixChanel}${userId}`)
        .emit('summary_status', { meetingId, ...data });
    } catch (error) {
      console.log(error);
    }
  }

  async handlePingPayment(userId: string, data: UserSubcription) {
    try {
      this.server.to(`${prefixChanel}${userId}`).emit('payment', data);
    } catch (error) {
      console.log(error);
    }
  }

  async handlePingTranscript(
    data: {
      transcript: string;
      speaker: string;
      time: string;
      newWords: boolean;
      start?: number;
      end?: number;
    },
    meetingId?: string,
  ) {
    try {
      this.server.emit(`${meetingId}_stream`, data);
    } catch (error) {
      console.log(error);
    }
  }

  async handleJoiningMeeting(
    meetingId: string,
    joiningStatus: JOINING_STATUS,
    organizer?: string,
  ) {
    try {
      this.server.emit(`${meetingId}_joining_status`, {
        joiningStatus,
        organizer,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
