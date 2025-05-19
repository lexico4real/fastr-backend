import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PayInvoiceDto {
  @ApiProperty({
    description: 'The unique identifier of the invoice',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  invoiceId: string;
}

export class BulkPayInvoiceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayInvoiceDto)
  payments: PayInvoiceDto[];
}