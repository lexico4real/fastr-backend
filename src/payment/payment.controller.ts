import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import {
  CreateBulkInvoiceDto,
  CreateInvoiceDto,
} from './dto/create-invoice.dto';
import { BulkPayInvoiceDto, PayInvoiceDto } from './dto/pay-invoice.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { AllPrivileges } from 'common/enums/privileges';
import { Throttle } from '@nestjs/throttler';

@Controller('payments')
@ApiTags('payments')
@ApiBearerAuth('token')
@UseGuards(AuthGuard(), PrivilegesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('invoices')
  @Privileges(AllPrivileges.CAN_GET_INVOICES)
  async getInvoices(
    @Req() req: Request,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
  ) {
    return await this.paymentService.getInvoices(page, perPage, req);
  }

  @Get('history')
  @Privileges(AllPrivileges.CAN_GET_PAYMENT_HISTORY)
  async getPaymentHistory(
    @Req() req: Request,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
  ) {
    return await this.paymentService.getPaymentHistory(page, perPage, req);
  }

  @Get('invoices/:invoiceId')
  @Privileges(AllPrivileges.CAN_GET_INVOICES)
  async getInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.['id'];
    return await this.paymentService.getInvoiceById(invoiceId, userId);
  }

  @Get('history/student')
  async getStudentHistory(
    @Req() req: Request,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
  ) {
    return await this.paymentService.getStudentHistory(page, perPage, req);
  }

  @Get('history/business')
  async getBusinessHistory(
    @Req() req: Request,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
  ) {
    return await this.paymentService.getBusinessHistory(page, perPage, req);
  }

  @Get('business/invoices')
  async getBusinessInvoices(
    @Req() req: Request,
    @Query('page') page: number,
    @Query('perPage') perPage: number,
  ) {
    return await this.paymentService.getAllInvoicesForBusiness(page, perPage, req);
  }

  @Post('create-invoice')
  @Privileges(AllPrivileges.CAN_CREATE_INVOICE)
  async createInvoice(@Body() dto: CreateInvoiceDto, @Req() req: Request) {
    const userId = req.user['id'];
    return await this.paymentService.createInvoice(userId, dto);
  }

  @Post('create-bulk-invoices')
  @Privileges(AllPrivileges.CAN_CREATE_INVOICE)
  async createBulkInvoices(
    @Req() req: Request,
    @Body() dto: CreateBulkInvoiceDto,
  ) {
    const userId = req.user['id'];
    return await this.paymentService.createBulkInvoices(userId, dto);
  }

  @Post('pay-invoice')
  @Privileges(AllPrivileges.CAN_MAKE_PAYMENT)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async payInvoice(@Body() dto: PayInvoiceDto, @Req() req: Request) {
    return await this.paymentService.payInvoice(req.user, dto);
  }

  @Post('pay-bulk-invoices')
  @Privileges(AllPrivileges.CAN_MAKE_PAYMENT)
  async payBulkInvoices(@Req() req: Request, @Body() dto: BulkPayInvoiceDto) {
    return await this.paymentService.payBulkInvoices(req.user, dto);
  }

  @Post('checkout')
  @Privileges(AllPrivileges.CAN_MAKE_PAYMENT)
  async createCheckoutSession(@Req() req: Request, @Body() dto: PayInvoiceDto) {
    const studentId = req.user['id'];
    return await this.paymentService.createCheckoutSession(studentId, dto);
  }

  @Post('create-bulk-invoices-async')
  @Privileges(AllPrivileges.CAN_CREATE_INVOICE)
  async createBulkInvoice(
    @Body() dto: CreateBulkInvoiceDto,
    @Req() req: Request,
  ) {
    return this.paymentService.createBulkInvoicesAsync(dto, req.user?.['id']);
  }
}
