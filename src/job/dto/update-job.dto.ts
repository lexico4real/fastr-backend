import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateJobDto } from './create-job.dto';
import { JobStatus } from 'common/enums/job-status';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(Object.values(JobStatus))
  status?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  closedAt?: Date;
}
