import { IUserSubcriptionRepository } from '@database/interfaces/user-subcription.entity';
import { EventsGateway } from '@modules/gateways/events.gateway';
import { Inject, Injectable, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import { Public } from 'src/base/decorators/auth.decorator';
import { Results } from 'src/base/response/result-builder';
import { IIdentityService } from 'src/shared/services/identity.service.interface';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  constructor(
    private configService: ConfigService,
    private readonly _identityService: IIdentityService,
    @Inject('IUserSubcriptionRepository')
    private readonly userSubcriptionRepository: IUserSubcriptionRepository,
    private readonly _eventGateway: EventsGateway,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
    );
  }

  async createPaymentIntent(stripePriceId: string, productId: string) {
    try {
      const user_name = this._identityService.name;
      const user_email = this._identityService.email;

      const stripe_customer = await this.stripe.customers.create({
        name: user_name,
        email: user_email,
      });

      const paymentSubcription = await this.stripe.subscriptions.create({
        customer: stripe_customer.id,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        items: [
          {
            price: stripePriceId,
          },
        ],
      });

      await this.stripe.paymentIntents.update(
        paymentSubcription.latest_invoice['payment_intent']['id'],
        {
          metadata: {
            product_id: productId,
            userId: this._identityService.id,
          },
        },
      );

      return Results.success({
        id: paymentSubcription.latest_invoice['payment_intent']['id'],
        clientSecret:
          paymentSubcription.latest_invoice['payment_intent']['client_secret'],
      });
    } catch (error) {
      return Results.error(error);
    }
  }

  async retrievePayment(intent_id: string, product_id: string) {
    try {
      const payment = await this.stripe.paymentIntents.retrieve(intent_id);
      if (payment.status === 'succeeded') {
        const check_user_sub_exist =
          await this.userSubcriptionRepository.findOneByCondition({
            payment_intent_id: intent_id,
          });
        if (check_user_sub_exist) {
          return Results.error('User has already subscribed');
        }
        const userSubscription = await this.userSubcriptionRepository.create({
          user: this._identityService._id,
          stripe_product_id: product_id,
        });

        return Results.success(userSubscription);
      } else {
        return Results.error(`Payment status is ${payment.status}`);
      }
    } catch (error) {
      return Results.error(`Error retrieving payment: ${error.message}`);
    }
  }

  async handleEvent(rawBody: Buffer, sig: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        this.configService.get<string>('STRIPE_ENDPOINT_SECRET_KEY'),
      );
    } catch (err) {
      Results.error(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const userSubcription = await this.userSubcriptionRepository.create({
          user: new mongoose.Types.ObjectId(paymentIntent.metadata.userId),
          stripe_product_id: paymentIntent.metadata.product_id,
        });
        this._eventGateway.handlePingPayment(
          paymentIntent.metadata.userId,
          userSubcription,
        );

        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return 'Webhook processed successfully';
  }

  async getProductInfo(productId: String) {
    try {
      if (!productId) return null;
      return await this.stripe.products.retrieve(productId as string);
    } catch (error) {
      return null;
    }
  }
}
