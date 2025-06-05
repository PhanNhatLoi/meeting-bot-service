export class MeetingCalendarDto {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  // creator: { email: 'phanloi971@gmail.com', self: true },
  organizer: { email: string; self: true };
  start: MeetingTimeDto;
  end: MeetingTimeDto;
  iCalUID: string;
  sequence: number;
  hangoutLink: string;
  eventType: string;
  conferenceData: {
    conferenceId: string;
  };
}

export class MeetingTimeDto {
  dateTime: string;
  timeZone: string;
}
