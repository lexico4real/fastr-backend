import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdatePaymentDto extends PartialType(CreateInvoiceDto) { }
