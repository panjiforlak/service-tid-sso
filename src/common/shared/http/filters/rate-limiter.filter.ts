import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { generateTrxId } from 'src/common/shared/helpers/common.helpers';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class RateLimiter implements ExceptionFilter {
  catch(_: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const trxId = (request.headers['x-transaction-id'] as string) || generateTrxId();

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
      data: { error: 'RATE_LIMIT_EXCEEDED' },
      trxId,
    });
  }
}
