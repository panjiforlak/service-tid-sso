import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { generateTrxId } from '../helpers/common.helper';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorResponse: any;
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      errorResponse = typeof res === 'string' ? { message: res } : res;
    } else {
      errorResponse = { message: 'Internal server error' };
    }

    const trxId = errorResponse.trxId || generateTrxId();

    response.status(status).json({
      statusCode: errorResponse.statusCode || status,
      message: errorResponse.message || 'Unknown error',
      data: errorResponse.data || { error: true },
      trxId,
    });
  }
}
