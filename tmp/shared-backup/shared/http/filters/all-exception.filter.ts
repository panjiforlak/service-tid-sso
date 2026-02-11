import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { generateTrxId } from 'src/common/shared/helpers/common.helpers';
import { ThrottlerException } from '@nestjs/throttler';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let payload: any = { message: 'Internal server error' };

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      payload = typeof res === 'string' ? { message: res } : res;
    }

    const trxId = (request.headers['x-transaction-id'] as string) || generateTrxId();

    response.status(status).json({
      statusCode: payload.statusCode || status,
      message: payload.message,
      data: payload.data || { error: true },
      trxId,
    });
  }
}
