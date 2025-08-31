import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { SearchAuditDto } from './dto/search-audit.dto';
import { generatePagination } from 'common/utils/pagination';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async log(
    event: string,
    target: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const audit = new this.auditModel({
        event,
        target,
        message,
        metadata,
      });

      await audit.save();
      this.logger.debug(`Audit log saved: ${event} -> ${target}`);
    } catch (error) {
      this.logger.error('Failed to save audit log', error.stack);
    }
  }

  async searchLogs(query: SearchAuditDto, req?: any) {
    const { page = 1, limit = 10, dateFrom, dateTo, ...filters } = query;

    const filterQuery: FilterQuery<AuditLogDocument> = {};

    if (filters.event) filterQuery.event = new RegExp(filters.event, 'i');
    if (filters.target) filterQuery.target = new RegExp(filters.target, 'i');
    if (filters.message) filterQuery.message = new RegExp(filters.message, 'i');

    if (dateFrom || dateTo) {
      filterQuery.createdAt = {};
      if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filterQuery.createdAt.$lte = new Date(dateTo);
    }

    const [items, totalItems] = await Promise.all([
      this.auditModel
        .find(filterQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.auditModel.countDocuments(filterQuery),
    ]);

    return generatePagination(page, limit, totalItems, req, items);
  }
}
