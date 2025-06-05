import { DynamicModule, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { ConfigModuleOptions } from '@nestjs/config';

@Module({
  imports: [],
  providers: [],
})
export class EventsModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule {
    const providers = [EventsGateway, EventsService];

    const exports = Object.assign([], providers);

    return {
      global: options?.isGlobal || true,
      module: EventsModule,
      imports: [],
      providers: providers,
      exports: exports,
    };
  }
}
