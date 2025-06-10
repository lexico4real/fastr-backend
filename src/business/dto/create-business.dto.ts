import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateBusinessDto {
  @ApiProperty({ description: 'Name of the business' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'Registration number of the business' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({ description: 'Address of the business', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Verification status of the business', required: false })
  @IsOptional()
  @IsString()
  verificationStatus?: string;
}
