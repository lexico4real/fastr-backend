import { IsUUID } from 'class-validator';

export class PayInvoiceDto {
  @IsUUID()
  invoiceId: string;
}
