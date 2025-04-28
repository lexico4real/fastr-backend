import { IsUUID } from "class-validator";

export class ApplyDto {
  @IsUUID()
  jobId: string;
}