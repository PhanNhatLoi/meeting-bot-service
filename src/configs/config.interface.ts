import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export interface AppConfig {
  environment: string;
  ai_url: string;
  database: DatabaseConfig;
  emailAccount: IEmailAccount;
  google: GuardConfigurationInfo;
  zoom: GuardConfigurationInfo;
  nest: NestConfig;
  cors: CorsConfig;
  swagger: SwaggerConfig;
  jwtServiceConfig: JwtServiceConfig;
  url: UrlConfig;
}

export interface IEmailAccount {
  username: string;
  password: string;
  fakeName: string;
}

export interface GuardConfigurationInfo {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface DatabaseConfig {
  uri: string;
  dbName: string;
}
export interface NestConfig {
  port: number;
}
export interface CorsConfig {
  enabled: boolean;
}
export interface SwaggerConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
  basicAuth: Record<string, string>;
  auth: {
    authOptions: any;
    name: string;
  };
  options: any;
  docOptions: {
    options: any;
  };
}

export interface SwaggerOptions {
  swaggerOptions: object;
}

export interface SwaggerDocOptions {
  options: object;
}

export interface JwtServiceConfig {
  secretKey: string;
  accessTokenExpirationTime: string;
  refreshTokenExpirationTime: string;
}

export interface UrlConfig {
  aiApiUrl: string;
  domainUrl: string;
}
