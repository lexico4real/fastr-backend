import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDate, IsIn, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateJobDto } from './create-job.dto';
import { JobStatus } from 'common/enums/job-status';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @ApiPropertyOptional({ description: 'The title of the job' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'A brief description of the job' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'The salary for the job', example: 50000 })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional({ description: 'Skills required for the job', type: [String] })
  @IsOptional()
  @IsArray()
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'The location of the job' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'The status of the job', enum: JobStatus })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(JobStatus))
  status?: string;

  @ApiPropertyOptional({ description: 'The date when the job is closed', type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  closedAt?: Date;
}
