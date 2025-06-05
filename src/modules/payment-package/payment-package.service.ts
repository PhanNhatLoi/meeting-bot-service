import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class PaymentPackageService {
    private stripe: Stripe;
    constructor(
        private configService: ConfigService,
    ) {
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET_KEY'),
        );
    }

    async getAll(currency: string, duration: string) {
        const listPrice = await this.stripe.prices.list({
            currency: currency,
        })

        const filteredPrices = listPrice.data.filter((price) => {
            return price.recurring?.interval === duration;
        });

        return filteredPrices;
    }

}