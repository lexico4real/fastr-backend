import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PaymentService } from '../payment.service';

@Processor('payments')
export class PaymentsProcessor {
  constructor(private paymentService: PaymentService) {}

  @Process('bulk-invoice')
  async handleBulkInvoice(job: Job) {
    const { userId, invoices } = job.data;
    return this.paymentService.createBulkInvoices(userId, { invoices });
  }

  @Process('bulk-payment')
  async handleBulkPayment(job: Job) {
    const { userId, payments } = job.data;
    return this.paymentService.payBulkInvoices(userId, { payments });
  }
}
