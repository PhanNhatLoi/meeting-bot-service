import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GLOBAL_CONFIG } from 'src/configs/configuration.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      expandVariables: true,
      load: [GLOBAL_CONFIG],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
