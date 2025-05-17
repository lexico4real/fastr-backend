import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({
    description: 'The score of the rating, must be an integer between 1 and 5',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @ApiPropertyOptional({
    description: 'Optional comment for the rating',
    example: 'Great service!',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'The UUID of the ratee being rated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  rateeId: string;
}
