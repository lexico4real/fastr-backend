import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDate } from "class-validator";

export class CreateJobDto {
  @ApiProperty({ description: 'The title of the job' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'A detailed description of the job' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'The salary offered for the job', example: 50000 })
  @IsNotEmpty()
  @IsNumber()
  salary: number;

  @ApiPropertyOptional({ description: 'The location of the job', example: 'Remote' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'The date and time when the job posting will close', type: String, format: 'date-time', example: '2023-12-31T23:59:59Z' })
  @IsDate()
  @Type(() => Date)
  closedAt: Date;
}
