import { Controller, Post, Headers, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';

@Controller('payments/stripe')
export class StripeController {
  constructor(private readonly paymentsService: PaymentService) { }

  @Post('fastr-webhook')
  async handleWebhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
      typescript: true,
    });

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req['rawBody'], signature, endpointSecret!);
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;

      if (invoiceId) {
        await this.paymentsService.markInvoiceAsPaid(invoiceId);
      }
    }

    return { received: true };
  }
}
