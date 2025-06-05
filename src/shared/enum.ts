export enum HashtagType {
  ORDER = 1,
  REQUEST = 2,
  SHOP = 3,
}

export enum USER_ROLE {
  SUPPER_ADMIN = 'SUPPER_ADMIN',
  USER = 'USER',
}

export enum MESSAGE_TYPE {
  WAITING = 'WAITING',
  SENT = 'SENT',
  SEEN = 'SEEN',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum PLATFORM {
  google = 'google',
  zoom = 'zoom',
  mst = 'mst',
  import = 'import',
  undefined = 'undefined',
}

export enum PAYMENT_STATUS {
  WAITING = 'waiting',
  SUCCESS = 'success',
  FAILED = 'failed',
}
export enum TRANSLATE_STATUS {
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export enum JOINING_STATUS {
  NEW = 'NEW',
  IMPORT = 'IMPORT',
  PROCESSING = 'PROCESSING',
  WATING_FOR_ADMIT = 'WATING_FOR_ADMIT',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export enum SUMMARY_CORE {
  ALIBABA = 'ALIBABA',
  GPT = 'GPT',
  GEMINI = 'GEMINI',
}

export enum DOMAIN_URL {
  JP = 'app.note.zebra-ai.net',
  US = 'app.ainote.one',
  local = 'localhost',
}

export enum LANGUAGE_CODE {
  vi = 'vi-VN',
  en = 'en-US',
  ja = 'ja-JP',
}

export enum LANGUAGE_KEY {
  vi = 'vi',
  en = 'en',
  ja = 'ja',
}

export const planLimit = {
  Free: {
    [SUMMARY_CORE.ALIBABA]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
    [SUMMARY_CORE.GPT]: {
      characterDayLimit: 100000,
      characterMonthLimit: 100000,
    },
    [SUMMARY_CORE.GEMINI]: {
      characterDayLimit: 500000,
      characterMonthLimit: 1000000,
    },
  },
  Pro: {
    [SUMMARY_CORE.ALIBABA]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
    [SUMMARY_CORE.GPT]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
    [SUMMARY_CORE.GEMINI]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
  },
  Bussiness: {
    [SUMMARY_CORE.ALIBABA]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
    [SUMMARY_CORE.GPT]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
    [SUMMARY_CORE.GEMINI]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
  },
  Enterprise: {
    [SUMMARY_CORE.ALIBABA]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
    [SUMMARY_CORE.GPT]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
    [SUMMARY_CORE.GEMINI]: {
      characterDayLimit: 1000000,
      characterMonthLimit: 10000000,
    },
  },
};
