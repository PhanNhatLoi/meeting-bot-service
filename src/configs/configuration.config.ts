import {
  SWAGGER_DES,
  SWAGGER_PREFIX,
  SWAGGER_TITLE,
} from 'src/shared/constants/global.constants';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const GLOBAL_CONFIG = () => ({
  environment: process.env.ENVIRONMENT,
  ai_url: process.env.AI_ANALYSIS_PATH,
  database: {
    uri: process.env.DATABASE_URI,
    dbName: process.env.DATABASE_NAME,
  },
  emailAccount: {
    username: process.env.GOOGLE_EMAIL_USER,
    password: process.env.GOOGLE_EMAIL_PASSWORD,
    fakeName: process.env.USER_NAME || 'Zens bot',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  zoom: {
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
    redirectUri: process.env.ZOOM_REDIRECT_URI,
  },
  nest: {
    port: process.env.PORT,
  },
  cors: {
    enabled: true,
  },
  swagger: {
    enabled: true,
    basicAuth: {
      ['admin']: 'admin@1230',
    },
    title: SWAGGER_TITLE,
    description: SWAGGER_DES,
    version: '1.5',
    path: SWAGGER_PREFIX,
    auth: {
      authOptions: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter Access token',
        in: 'header',
      },
      name: 'JWT-auth',
    },
    options: {
      swaggerOptions: {
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        persistAuthorization: true,
        explorer: 'boolean',
        customCss: 'string',
        customCssUrl: 'string',
        customJs: 'string',
        customfavIcon: 'string',
        swaggerUrl: 'string',
        customSiteTitle: 'string',
        validatorUrl: 'string',
        url: 'string',
      },
    },
    docOptions: {
      options: {
        deepScanRoutes: true,
        operationIdFactory: (controllerKey: string, methodKey: string) =>
          methodKey,
      },
    },
  },
  jwtServiceConfig: {
    secretKey: process.env.JWT_SECRET_KEY,
    accessTokenExpirationTime: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
    refreshTokenExpirationTime: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
  },
  url: {
    aiApiUrl: process.env.AI_API_URL,
    domainUrl: process.env.DOMAIN_URL,
  },
});

export const multerConfig = (dest: string) => {
  return {
    storage: diskStorage({
      destination: `./files/${dest}`,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}-${file.mimetype.split('/')[0]}${ext}`);
      },
    }),
  };
};

export const multerOptions = (props?: { fileSize?: number }) => {
  return {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi|mkv|webm)$/)) {
        return cb(new BadRequestException('Unsupported file type'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 1024 * 1024 * (props?.fileSize || 1), // MB
    },
  };
};
