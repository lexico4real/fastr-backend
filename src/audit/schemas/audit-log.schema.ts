import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ index: true })
  event: string;

  @Prop({ index: true })
  target: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
