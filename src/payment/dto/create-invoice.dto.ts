import { IsUUID, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'The UUID of the student' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Description of the invoice' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Amount of the invoice', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;
}
