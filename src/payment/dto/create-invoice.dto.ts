import { IsUUID, IsString, IsNumber, Min, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'The UUID of the student' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Description of the invoice' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'The UUID of the job' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({ description: 'Amount of the invoice', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateBulkInvoiceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceDto)
  invoices: CreateInvoiceDto[];
}