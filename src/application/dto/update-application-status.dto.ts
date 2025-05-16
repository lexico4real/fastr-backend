import { IsIn, IsString } from "class-validator";
import { ApplicationStatus } from "common/enums/application-status";

export class UpdateApplicationStatusDto {
  @IsString()
  @IsIn(Object.values(ApplicationStatus))
  status: string;
}
