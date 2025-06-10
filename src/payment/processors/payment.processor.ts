import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PaymentService } from '../payment.service';

@Processor('payments')
export class PaymentsProcessor {
  constructor(private paymentService: PaymentService) {}

  @Process('bulk-invoice')
  async handleBulkInvoice(job: Job) {
    try {
      const { userId, invoices } = job.data;
      return this.paymentService.createBulkInvoices(userId, { invoices });
    } catch (error) {
      console.error('Error processing bulk invoice job:', error);
    }
  }

  @Process('bulk-payment')
  async handleBulkPayment(job: Job) {
    try {
      const { userId, payments } = job.data;
      return this.paymentService.payBulkInvoices(userId, { payments });
    } catch (error) {
      console.error('Error processing bulk payment job:', error);
    }
  }
}
