import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    currUrl: string;
    prevUrl: string | null;
    nextUrl: string | null;
  };
}

export function generatePagination<T>(
  page: number,
  perPage: number,
  totalItems: number,
  req: Request,
  items: T[],
): PaginationResult<T> {
  const totalPages = Math.ceil(totalItems / perPage);
  const prevPage = Number(page) > 1 ? Number(page) - 1 : null;
  const nextPage = Number(page) < totalPages ? Number(page) + 1 : null;

  if (page < 1 || perPage < 1) {
    throw new BadRequestException('Invalid pagination parameters');
  }
  if (totalItems < 0) {
    throw new BadRequestException('Total items cannot be negative');
  }

  const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const _baseUrl = baseUrl.includes('?') ? baseUrl.split('?')[0] : baseUrl;
  const prevUrl = prevPage
    ? `${_baseUrl}?page=${prevPage}&perPage=${perPage}`
    : null;
  const nextUrl = nextPage
    ? `${_baseUrl}?page=${nextPage}&perPage=${perPage}`
    : null;

  return {
    data: items,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: perPage,
      currUrl: baseUrl,
      prevUrl,
      nextUrl,
    },
  };
}