import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { ConfigService } from "@nestjs/config";
import { WebhookController } from "./webhook.controller";

@Module({
    imports: [],
    providers: [
      PaymentService,
      ConfigService,
    ],
    controllers: [PaymentController, WebhookController],
  })
  export class PaymentModule {}