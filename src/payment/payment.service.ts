import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectStripe } from 'nestjs-stripe';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Request } from 'express';
import { BulkPayInvoiceDto, PayInvoiceDto } from './dto/pay-invoice.dto';
import { PaymentStatus } from 'common/enums/payment-status';
import {
  CreateBulkInvoiceDto,
  CreateInvoiceDto,
} from './dto/create-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import Logger from 'config/logger';
import { InvoiceJobName, QueueName } from 'common/enums/job-constants';
import { isUUID } from 'class-validator';
import { generatePagination } from 'common/utils/pagination';
import { renderEmailTemplate } from 'common/templates/renders/render-email-template';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectStripe() private readonly stripeClient: Stripe,
    @InjectQueue(QueueName.INVOICE_QUEUE)
    private invoiceQueue: Queue,
    private readonly emailService: EmailService,
  ) {}

  async createInvoice(businessId: string, dto: CreateInvoiceDto) {
    try {
      const invoice = this.invoiceRepository.create({
        businessId,
        studentId: dto.studentId,
        description: dto.description,
        amount: dto.amount,
        status: PaymentStatus.PENDING,
      });
      const savedInvoice = await this.invoiceRepository.save(invoice);
      this.logger.log(
        'PaymentService',
        'info',
        'Invoice created successfully',
        'payment-service',
      );
      return savedInvoice;
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        'Failed to create invoice',
        'payment-service',
      );
      throw new InternalServerErrorException('Failed to create invoice');
    }
  }

  async payInvoice(user: any, dto: PayInvoiceDto) {
    try {
      const studentId = user.id;
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

      const template = fs.readFileSync(
        path.join(__dirname, 'salary-payment.html'),
        'utf8',
      );

      const renderedHtml = renderEmailTemplate(template, {
        jobTitle: invoice.description,
        companyName: invoice?.business?.business?.businessName,
        invoiceId: invoice.id,
        amount: invoice.amount,
        studentEmail: invoice?.student?.email,
        paymentDate: new Date().toLocaleDateString(),
        reference: paymentIntent.id,
        supportEmail: 'support@fastr.com',
        year: new Date().getFullYear(),
      });

      await this.emailService.sendMail({
        to: invoice.business.email,
        subject: 'Payment Initiated',
        text: '',
        html: renderedHtml,
      });

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to process payment: ${error.message}`,
        'payment-service',
      );
      throw error instanceof NotFoundException
        ? error
        : error instanceof ForbiddenException
          ? error
          : new InternalServerErrorException('Failed to process payment');
    }
  }

  async getInvoices(page = 1, perPage = 10, req?: Request) {
    try {
      const userId = req.user['id'];
      const skip = (page - 1) * perPage;
      const [invoices, total] = await this.invoiceRepository.findAndCount({
        where: [{ businessId: userId }, { studentId: userId }],
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });
      return generatePagination(page, perPage, total, req, invoices);
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to retrieve invoices: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException('Failed to retrieve invoices');
    }
  }

  async getInvoiceById(invoiceId: string, userId: string) {
    if (!isUUID(invoiceId)) {
      throw new NotFoundException('Invalid invoice ID');
    }
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId },
      });
      if (!invoice) {
        this.logger.log(
          'PaymentService',
          'warn',
          'Invoice not found',
          'payment-service',
        );
        throw new NotFoundException('Invoice not found');
      }
      if (invoice.studentId !== userId && invoice.businessId !== userId) {
        throw new ForbiddenException('You do not have access to this invoice');
      }
      this.logger.log(
        'PaymentService',
        'info',
        'Invoice retrieved successfully',
        'payment-service',
      );
      return invoice;
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to retrieve invoice: ${error.message}`,
        'payment-service',
      );
      throw error instanceof NotFoundException
        ? error
        : error instanceof ForbiddenException
          ? error
          : new InternalServerErrorException('Failed to retrieve invoice');
    }
  }

  async getPaymentHistory(page = 1, perPage = 10, req?: Request) {
    try {
      const studentId = req.user['id'];
      const skip = (page - 1) * perPage;
      const [history, total] = await this.invoiceRepository.findAndCount({
        where: { studentId, status: PaymentStatus.COMPLETED },
        order: { paidAt: 'DESC' },
        skip,
        take: perPage,
      });

      this.logger.log(
        'PaymentService',
        'info',
        'Payment history retrieved successfully',
        'payment-service',
      );
      return generatePagination(page, perPage, total, req, history);
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to retrieve payment history: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve payment history',
      );
    }
  }

  async getStudentHistory(page = 1, perPage = 10, req?: Request) {
    try {
      const studentId = req.user['id'];
      const skip = (page - 1) * perPage;
      const [history, total] = await this.invoiceRepository.findAndCount({
        where: { student: { id: studentId } },
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });
      return generatePagination(page, perPage, total, req, history);
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to retrieve student history: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve student history',
      );
    }
  }

  async getBusinessHistory(page = 1, perPage = 10, req?: Request) {
    try {
      const businessId = req.user['id'];
      const skip = (page - 1) * perPage;
      const [history, total] = await this.invoiceRepository.findAndCount({
        where: { business: { id: businessId } },
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });
      return generatePagination(page, perPage, total, req, history);
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to retrieve business history: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve business history',
      );
    }
  }

  async getAllInvoicesForBusiness(
    page = 1,
    perPage = 10,
    req?: Request,
  ) {
    try {
      const businessId = req.user['id'];
      const skip = (page - 1) * perPage;
      const [invoices, total] = await this.invoiceRepository.findAndCount({
        where: { business: { id: businessId } },
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });
      return generatePagination(page, perPage, total, req, invoices);
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to retrieve all invoices for business: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve all invoices for business',
      );
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
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to mark invoice as paid: ${error.message}`,
        'payment-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to mark invoice as paid');
    }
  }

  async createCheckoutSession(studentId: string, dto: PayInvoiceDto) {
    try {
      const { invoiceId } = dto;
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId, studentId },
      });

      if (!invoice) {
        this.logger.log(
          'PaymentService',
          'warn',
          'Invoice not found',
          'payment-service',
        );
        throw new NotFoundException('Invoice not found');
      }
      if (invoice.status === PaymentStatus.COMPLETED) {
        this.logger.log(
          'PaymentService',
          'warn',
          'Invoice already paid',
          'payment-service',
        );
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

      this.logger.log(
        'PaymentService',
        'info',
        'Checkout session created successfully',
        'payment-service',
      );
      return {
        url: session.url,
      };
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to create checkout session: ${error.message}`,
        'payment-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to create checkout session');
    }
  }

  async createBulkInvoices(userId: string, dto: CreateBulkInvoiceDto) {
    try {
      const chunkSize = 50;
      const chunks = [];

      for (let i = 0; i < dto.invoices.length; i += chunkSize) {
        chunks.push(dto.invoices.slice(i, i + chunkSize));
      }

      const results = [];
      for (const chunk of chunks) {
        const res = await Promise.allSettled(
          chunk.map((invoice: CreateInvoiceDto) =>
            this.createInvoice(userId, invoice),
          ),
        );
        results.push(...res);
      }

      const created = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason);

      return { created, errors };
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to create bulk invoices: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException('Failed to create bulk invoices');
    }
  }

  async payBulkInvoices(user: any, dto: BulkPayInvoiceDto) {
    try {
      const paid = [];
      const errors = [];

      for (const payment of dto.payments) {
        try {
          const result = await this.payInvoice(user, payment);
          paid.push(result);
        } catch (error) {
          errors.push({ payment, error: error.message });
        }
      }

      return {
        successCount: paid.length,
        errorCount: errors.length,
        paid,
        errors,
      };
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to process bulk payments: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException('Failed to process bulk payments');
    }
  }

  async createBulkInvoicesAsync(dto: CreateBulkInvoiceDto, userId: string) {
    try {
      await this.invoiceQueue.add(InvoiceJobName.CREATE_BULK_INVOICE_JOB, {
        dto,
        createdBy: userId,
      });
      return { message: 'Bulk invoice creation started' };
    } catch (error) {
      this.logger.log(
        'PaymentService',
        'error',
        `Failed to enqueue bulk invoice creation: ${error.message}`,
        'payment-service',
      );
      throw new InternalServerErrorException(
        'Failed to enqueue bulk invoice creation',
      );
    }
  }
}
