import { FindManyOptions, ILike, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Request } from 'express';
import { generatePagination } from 'common/utils/pagination';
import { Invoice } from '../entities/invoice.entity';
import { PayInvoiceDto } from '../dto/pay-invoice.dto';
import { PaymentStatus } from 'common/enums/payment-status';

export class InvoiceRepository extends Repository<Invoice> {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {
    super(
      invoiceRepository.target,
      invoiceRepository.manager,
      invoiceRepository.queryRunner,
    );
  }
}
