import * as moment from 'moment-timezone';
export const API_PREFIX = '/api/v1';
export const SWAGGER_PREFIX = '/swagger';
export const SWAGGER_TITLE = 'Meeting Bot backend API Project';
export const SWAGGER_DES = 'Meeting Bot backend description';
export const DEFAULT_PAGE_LIMIT = 25;

export enum ENVIRONMENT {
  DEVELOP = 'develop',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export const OTP_TIME = 300;

declare global {
  interface Window {
    handlePingChat: (chatMessage: {
      sender: string | null;
      message: string | null;
    }) => void;
    handleOpenChat: () => void;
    participantOnchange: (val: number) => void;
    handleListUsers: (vals: string[]) => void;
  }
}

export function convertToUTC(dateTime: string, timeZone: string): Date {
  return moment.tz(dateTime, timeZone).utc().toDate();
}
