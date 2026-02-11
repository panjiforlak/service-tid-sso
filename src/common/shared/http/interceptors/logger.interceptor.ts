import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { toCustomUpperCase } from 'src/common/shared/helpers/common.helpers';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request & { id?: string }>();
    const res = context.switchToHttp().getResponse<Response>();

    const start = Date.now();
    const traceId = req.headers['x-transaction-id']?.toString() || req.id;

    const sanitizedBody = { ...req.body };
    if (sanitizedBody?.password) sanitizedBody.password = '******';

    return next.handle().pipe(
      tap(() => {
        this.logger.info(
          {
            traceId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${Date.now() - start}ms`,
          },
          'Successfully',
        );

        if (process.env.DEBUG === 'yes') {
          this.logger.debug({
            traceId,
            body: sanitizedBody,
            query: req.query,
            params: req.params,
          });
        }
      }),
      catchError((error) => {
        const statusCode = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        // Ambil context dari error (jika ada)
        const source = error?.source || 'file-name';
        const context = error?.context || 'function-name';

        this.logger.error(
          {
            traceId,
            method: req.method,
            path: req.originalUrl,
            statusCode,
            responseTime: `${Date.now() - start}ms`,
            error: error?.response?.message || error.message,
          },

          `${toCustomUpperCase(source)}:||:${toCustomUpperCase(context)}`, // dipakai cuma untuk log
        );

        return throwError(() => error);
      }),
    );
  }
}
