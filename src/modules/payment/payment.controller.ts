import { Body, Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Results } from 'src/base/response/result-builder';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/base/decorators/auth.decorator';

@ApiTags('payment')
@Controller('payment') // Endpoint chính: /payments
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @ApiOperation({
    summary: 'Tạo Payment Intent',
    description: 'Tạo một Payment Intent với số tiền cụ thể.',
  })
  @ApiBody({
    description: 'Thông tin thanh toán',
    schema: {
      type: 'object',
      properties: {
        stripePriceId: {
          type: 'string',
        },
        productId: {
          type: 'string',
        },
      },
    },
  })
  async createPaymentIntent(
    @Body() body: { stripePriceId: string; productId: string },
  ) {
    const result = await this.paymentService.createPaymentIntent(
      body.stripePriceId,
      body.productId,
    );

    return result;
  }

  @Post('retrieve')
  @ApiBody({
    description: 'Thông tin cần thiết để xử lý thanh toán',
    schema: {
      type: 'object',
      properties: {
        intent_id: { type: 'string', example: 'pi_XXXXXXXXXXXXXX' },
        product_id: { type: 'string', example: 'prod_RacT7AfMQwFy0H' },
      },
    },
  })
  async retrievePayment(
    @Body() body: { intent_id: string; product_id: string },
  ) {
    const { intent_id, product_id } = body;

    if (!intent_id) {
      return Results.error('Invalid intent_id');
    }

    if (!product_id) {
      return Results.error('Invalid product_id');
    }

    const result = await this.paymentService.retrievePayment(
      intent_id,
      product_id,
    );
    return result;
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req,
    @Res() res,
    @Headers('stripe-signature') sig: string,
  ) {
    try {
      await this.paymentService.handleEvent(req.body, sig);
      res.status(200).send();
    } catch (error) {
      res.status(400).send();
    }
  }
}
