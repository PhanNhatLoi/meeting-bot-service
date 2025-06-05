import { forwardRef, Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { ConfigModule } from '@nestjs/config';
import { GLOBAL_CONFIG } from 'src/configs/configuration.config';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategys/google.strategy';
import { HttpModule } from '@nestjs/axios';
import { GoogleController } from './google.controller';
import { QueueModule } from '@modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      expandVariables: true,
      load: [GLOBAL_CONFIG],
    }),
    HttpModule,
    PassportModule.register({ defaultStrategy: 'google' }),
    forwardRef(() => QueueModule),
  ],
  providers: [GoogleService, GoogleStrategy],
  controllers: [GoogleController],
  exports: [GoogleService],
})
export class GoogleModule {}
