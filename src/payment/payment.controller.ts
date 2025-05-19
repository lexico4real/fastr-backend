import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreateBulkInvoiceDto, CreateInvoiceDto } from './dto/create-invoice.dto';
import { BulkPayInvoiceDto, PayInvoiceDto } from './dto/pay-invoice.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { PrivilegesConstant } from 'common/enums/privileges';
import { Throttle } from '@nestjs/throttler';

@Controller('payments')
@ApiTags('payments')
@ApiBearerAuth('token')
@UseGuards(AuthGuard(), PrivilegesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('invoices')
  @Privileges(PrivilegesConstant.CAN_GET_INVOICES)
  async getInvoices(@Req() req: Request) {
    const userId = req.user['id'];
    return await this.paymentService.getInvoices(userId);
  }

  @Get('history')
  @Privileges(PrivilegesConstant.CAN_GET_PAYMENT_HISTORY)
  async getPaymentHistory(@Req() req: Request) {
    const userId = req.user?.['id'];
    return await this.paymentService.getPaymentHistory(userId);
  }

  @Get('invoices/:invoiceId')
  @Privileges(PrivilegesConstant.CAN_GET_INVOICES)
  async getInvoice(@Param('invoiceId') invoiceId: string, @Req() req: Request) {
    const userId = req.user?.['id'];
    return await this.paymentService.getInvoiceById(invoiceId, userId);
  }

  @Get('history/student')
  async getStudentHistory(@Req() req: Request) {
    const studentId = req.user?.['id'];
    return await this.paymentService.getStudentHistory(studentId);
  }

  @Get('history/business')
  async getBusinessHistory(@Req() req: Request) {
    const businessId = req.user?.['id'];
    return await this.paymentService.getBusinessHistory(businessId);
  }

  @Get('business/invoices')
  async getBusinessInvoices(@Req() req: Request) {
    const businessId = req.user?.['id'];
    return await this.paymentService.getAllInvoicesForBusiness(businessId);
  }

  @Post('create-invoice')
  @Privileges(PrivilegesConstant.CAN_CREATE_INVOICE)
  async createInvoice(@Body() dto: CreateInvoiceDto, @Req() req: Request) {
    const userId = req.user['id'];
    return await this.paymentService.createInvoice(userId, dto);
  }

  @Post('create-bulk-invoices')
  @Privileges(PrivilegesConstant.CAN_CREATE_INVOICE)
  async createBulkInvoices(
    @Req() req: Request,
    @Body() dto: CreateBulkInvoiceDto,
  ) {
    const userId = req.user['id'];
    return await this.paymentService.createBulkInvoices(userId, dto);
  }

  @Post('pay-invoice')
  @Privileges(PrivilegesConstant.CAN_MAKE_PAYMENT)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async payInvoice(@Body() dto: PayInvoiceDto, @Req() req: Request) {
    const userId = req.user['id'];
    return await this.paymentService.payInvoice(userId, dto);
  }

  @Post('pay-bulk-invoices')
  @Privileges(PrivilegesConstant.CAN_MAKE_PAYMENT)
  async payBulkInvoices(@Req() req: Request, @Body() dto: BulkPayInvoiceDto) {
    const userId = req.user['id'];
    return await this.paymentService.payBulkInvoices(userId, dto);
  }

  @Post('checkout')
  @Privileges(PrivilegesConstant.CAN_MAKE_PAYMENT)
  async createCheckoutSession(@Req() req: Request, @Body() dto: PayInvoiceDto) {
    const studentId = req.user['id'];
    return await this.paymentService.createCheckoutSession(studentId, dto);
  }

  @Post('create-bulk-invoices-async')
  @Privileges(PrivilegesConstant.CAN_CREATE_INVOICE)
  async createBulkInvoice(
    @Body() dto: CreateBulkInvoiceDto,
    @Req() req: Request,
  ) {
    return this.paymentService.createBulkInvoicesAsync(dto, req.user?.['id']);
  }
}
