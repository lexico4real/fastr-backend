import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayInvoiceDto {
  @ApiProperty({
    description: 'The unique identifier of the invoice',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  invoiceId: string;
}
