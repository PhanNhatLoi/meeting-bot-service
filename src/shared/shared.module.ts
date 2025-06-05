import { UploadFileService } from '@modules/file/services/upload-file.service';
import { EventsGateway } from '@modules/gateways/events.gateway';
import { UserAccountService } from '@modules/user-account/services/user-account.service';
import { WordAnalysisService } from '@modules/word-analysis/word-analysis.service';
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModuleOptions } from '@nestjs/config';
import { IdentityService } from 'src/shared/services/identity.service';
import { IIdentityService } from 'src/shared/services/identity.service.interface';

@Module({
  imports: [],
  providers: [],
})
export class SharedModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule {
    const providers = [
      {
        provide: IIdentityService,
        useClass: IdentityService,
      },
      EventsGateway,
      UserAccountService,
      UploadFileService,
      WordAnalysisService,
    ];

    const exports = Object.assign([], providers);

    return {
      global: options?.isGlobal || true,
      module: SharedModule,
      providers: providers,
      exports: exports,
    };
  }
}
