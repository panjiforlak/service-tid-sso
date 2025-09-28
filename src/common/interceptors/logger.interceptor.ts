import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { generateTrxId } from '@/common/helpers/common.helper';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request & { body?: any }>();
    const method = req.method;
    const url = req.url;
    const now = Date.now();

    const trxId = generateTrxId();

    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '******';

    return next.handle().pipe(
      tap((res) => {
        const duration = Date.now() - now;
        const statusCode = (res?.statusCode as number) ?? HttpStatus.OK;

        this.logger.log(`[${trxId}] ${method} ${url} ${statusCode} [${duration}ms]`);

        if (process.env.DEBUG === 'yes') {
          this.logger.debug(
            JSON.stringify({
              trx: trxId,
              statusCode,
              method,
              url,
              body: sanitizedBody,
              response: res?.data ?? res,
            }),
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        const statusCode = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        this.logger.error(`[${trxId}] ${method} ${url} ${statusCode} [${duration}ms] Error: ${error.message}`);

        if (process.env.DEBUG === 'yes') {
          this.logger.debug(
            JSON.stringify({
              trx: trxId,
              statusCode,
              method,
              url,
              body: sanitizedBody,
              error: error.message,
            }),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
