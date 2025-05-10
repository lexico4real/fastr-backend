import { IsUUID, IsString, IsNumber, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  studentId: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;
}
