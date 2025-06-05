import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseConfig } from 'src/configs/config.interface';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.getOrThrow<DatabaseConfig>('database').uri,
        dbName:configService.getOrThrow<DatabaseConfig>('database').dbName,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
