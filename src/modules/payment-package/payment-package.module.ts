import { Module } from "@nestjs/common";
import { PaymentPackageService } from "./payment-package.service";
import { PaymentPackageController } from "./payment-package.controller";

@Module({
    imports: [],
    providers: [
      PaymentPackageService,
    ],
    controllers: [PaymentPackageController],
  })
  export class PaymentPackageModule {}