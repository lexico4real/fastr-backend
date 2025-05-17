import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Logger from '.';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = uuidv4();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? this.getErrorMessage(exception)
      : 'Internal server error';

    const errorLog = {
      traceId,
      statusCode: status,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      message,
      stack:
        process.env.NODE_ENV !== 'production' && exception instanceof Error
          ? exception.stack
          : undefined,
    };

    const logName =
      `${request.method}-${request.route?.path || request.url}`.replace(
        /[\/:]/g,
        '_',
      );
    const fileName =
      `${status}-${request.method}-${request.url.split('?')[0]}`.replace(
        /[\/:]/g,
        '_',
      );

    this.logger.log(
      logName ||  'http-error',
      'error',
      JSON.stringify(errorLog, null, 2),
      fileName || 'http-error',
    );

    response.status(status).json({
      statusCode: status,
      success: false,
      message,
      path: request.url,
      method: request.method,
      timestamp: errorLog.timestamp,
      traceId,
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? { stack: errorLog.stack }
        : {}),
    });
  }

  private getErrorMessage(exception: HttpException): string | string[] {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      return (response as any).message;
    }

    return 'Unexpected error occurred';
  }
}
