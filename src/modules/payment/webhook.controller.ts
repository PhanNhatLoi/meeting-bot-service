import { IUserSubcriptionRepository } from '@database/interfaces/user-subcription.entity';
import { Controller, Inject, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Public } from 'src/base/decorators/auth.decorator';
import { Results } from 'src/base/response/result-builder';
import { IIdentityService } from 'src/shared/services/identity.service.interface';
import Stripe from 'stripe';

@Public()
@Controller('webhook')
export class WebhookController {
    private stripe = new Stripe('your-stripe-secret-key');
    constructor(
        private configService: ConfigService,
        private readonly _identityService: IIdentityService,
        @Inject('IUserSubcriptionRepository')
        private readonly userSubcriptionRepository: IUserSubcriptionRepository,
    ) {
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET_KEY'),
        );
    }
    @Post()
    async handleWebhook(@Req() req: Request, @Res() res: Response) {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = this.configService.get<string>('STRIPE_ENDPOINT_SECRET_KEY');

        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;

                await this.userSubcriptionRepository.create({
                    user: this._identityService._id,
                    stripe_product_id: paymentIntent.metadata.product_id,
                });

                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.send();
    }
}
