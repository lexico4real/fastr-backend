import { ForbiddenException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectStripe } from 'nestjs-stripe';
import { Request } from 'express';
import Stripe from 'stripe';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { PaymentStatus } from 'common/enums/payment-status';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectStripe() private readonly stripeClient: Stripe
  ) { }

  async createInvoice(businessId: string, dto: CreateInvoiceDto) {
    try {
      const invoice = this.invoiceRepository.create({
        businessId,
        studentId: dto.studentId,
        description: dto.description,
        amount: dto.amount,
        status: PaymentStatus.PENDING,
      });
      return await this.invoiceRepository.save(invoice);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create invoice');
    }
  }

  async payInvoice(studentId: string, dto: PayInvoiceDto) {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to process payment');
    }
  }

  async getInvoices(userId: string) {
    try {
      return await this.invoiceRepository.find({
        where: [
          { businessId: userId },
          { studentId: userId },
        ],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve invoices');
    }
  }

  async getInvoiceById(invoiceId: string) {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      return invoice;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve invoice');
    }
  }

  async getPaymentHistory(studentId: string) {
    try {
      return await this.invoiceRepository.find({
        where: { studentId, status: PaymentStatus.COMPLETED },
        order: { paidAt: 'DESC' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve payment history');
    }
  }

  async markInvoiceAsPaid(invoiceId: string) {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to mark invoice as paid');
    }
  }

  async createCheckoutSession(studentId: string, dto: PayInvoiceDto) {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to create checkout session');
    }
  }
}
