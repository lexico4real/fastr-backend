import { IsOptional, IsString, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchAuditDto {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @IsOptional()
  @Type(() => Object)
  metadata?: Record<string, any>;
}
