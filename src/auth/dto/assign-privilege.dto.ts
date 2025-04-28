import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPrivilegeDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  privilegeIds: string[];
}