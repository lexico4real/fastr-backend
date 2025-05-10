import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrivilegesGuard } from 'src/auth/guards/privileges.guard';
import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { PrivilegesConstant } from 'common/enums/privileges';

@ApiTags('payments')
@ApiBearerAuth('token')
@UseGuards(AuthGuard())
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Get('invoices')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_GET_INVOICES)
  async getInvoices(@Req() req: Request) {
    const userId = req.user['id'];
    return await this.paymentService.getInvoices(userId);
  }

  @Get('history')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_GET_PAYMENT_HISTORY)
  async getPaymentHistory(@Req() req: Request) {
    const userId = req.user['id'];
    return await this.paymentService.getPaymentHistory(userId);
  }

  @Get('invoices/:invoiceId')
  async getInvoice(@Param('invoiceId') invoiceId: string) {
    return await this.paymentService.getInvoiceById(invoiceId);
  }

  @Post('create-invoice')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_GET_INVOICES)
  async createInvoice(@Req() req: Request, @Body() dto: CreateInvoiceDto) {
    const userId = req.user['id'];
    return await this.paymentService.createInvoice(userId, dto);
  }

  @Post('pay-invoice')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_MAKE_PAYMENT)
  async payInvoice(@Req() req: Request, @Body() dto: PayInvoiceDto) {
    const userId = req.user['id'];
    return await this.paymentService.payInvoice(userId, dto);
  }

  @Post('checkout')
  @UseGuards(AuthGuard(), PrivilegesGuard)
  @Privileges(PrivilegesConstant.CAN_MAKE_PAYMENT)
  async createCheckoutSession(@Req() req: Request, @Body() dto: PayInvoiceDto) {
    const studentId = req.user['id'];
    return await this.paymentService.createCheckoutSession(studentId, dto);
  }
}
