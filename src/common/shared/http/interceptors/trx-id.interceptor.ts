import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { tap } from 'rxjs';
import { generateTrxId } from 'src/common/shared/helpers/common.helpers';

@Injectable()
export class TrxIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const trxId = (req.headers['x-transaction-id'] as string) || generateTrxId();

    // res.setHeader('x-transaction-id', trxId);
    res.header('x-transaction-id', trxId);
    return next.handle().pipe(
      tap((data) => {
        // inject trxId ke response body
        if (data && typeof data === 'object' && !data.trxId) {
          data.trxId = trxId;
        }
      }),
    );
  }
}
