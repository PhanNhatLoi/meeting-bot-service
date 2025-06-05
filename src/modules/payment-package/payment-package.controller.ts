import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentPackageService } from "./payment-package.service";
import { Public } from "src/base/decorators/auth.decorator";

@ApiTags('payment-package')
@Controller('payment-package') // Endpoint chính: /payments
export class PaymentPackageController {
    constructor(private readonly paymentPackageService: PaymentPackageService) {}

    @Get('/:currency/:duration')
    async getAllPaymentPackages(@Param('currency') currency: string, @Param('duration') duration: string) {
        return await this.paymentPackageService.getAll(currency, duration);
    }
}