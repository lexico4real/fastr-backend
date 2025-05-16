import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectStripe } from 'nestjs-stripe';
import { Request } from 'express';
import Stripe from 'stripe';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { PaymentStatus } from 'common/enums/payment-status';
import { InvoiceRepository } from './repositories/invoice.repositories';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(InvoiceRepository)
    private readonly invoiceRepository: InvoiceRepository,
    @InjectStripe() private readonly stripeClient: Stripe
  ) { }

  async createInvoice(businessId: string, dto: CreateInvoiceDto) {
    const invoice = this.invoiceRepository.create({
      businessId,
      studentId: dto.studentId,
      description: dto.description,
      amount: dto.amount,
      status: PaymentStatus.PENDING,
    });
    return await this.invoiceRepository.save(invoice);
  }

  async payInvoice(studentId: string, dto: PayInvoiceDto) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: dto.invoiceId, studentId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === PaymentStatus.COMPLETED) {
      throw new ForbiddenException('Invoice already paid');
    }

    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: Math.round(Number(invoice.amount) * 100),
      currency: 'usd',
      metadata: {
        invoiceId: invoice.id,
        studentId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  async getInvoices(userId: string) {
    return await this.invoiceRepository.find({
      where: [
        { businessId: userId },
        { studentId: userId },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getInvoiceById(invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async getPaymentHistory(studentId: string) {
    return await this.invoiceRepository.find({
      where: { studentId, status: PaymentStatus.COMPLETED },
      order: { paidAt: 'DESC' },
    });
  }

  async markInvoiceAsPaid(invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    invoice.status = PaymentStatus.COMPLETED;
    invoice.paidAt = new Date();
    invoice.updatedAt = new Date();

    await this.invoiceRepository.save(invoice);
  }

  async createCheckoutSession(studentId: string, dto: PayInvoiceDto) {
    const { invoiceId } = dto;
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, studentId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === PaymentStatus.COMPLETED) {
      throw new NotFoundException('Invoice already paid');
    }

    const session = await this.stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: invoice.description,
            },
            unit_amount: Math.round(Number(invoice.amount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/success?invoiceId=${invoice.id}`, // frontend success page
      cancel_url: `http://localhost:3000/cancel`, // frontend cancel page
      metadata: {
        invoiceId: invoice.id,
        studentId: studentId,
      },
    });

    return {
      url: session.url,
    };
  }
}

