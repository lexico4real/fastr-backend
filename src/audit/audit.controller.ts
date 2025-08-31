import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { SearchAuditDto } from './dto/search-audit.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard())
@ApiBearerAuth('token')
@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getAuditLogs(@Query() query: SearchAuditDto, @Req() req: Request) {
    return this.auditService.searchLogs(query, req);
  }
}
