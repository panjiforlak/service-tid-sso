/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request & { body?: any }>();
    const method = req.method;
    const url = req.url;
    const now = Date.now();

    // Salin body tapi sembunyikan password
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '******';

    return next.handle().pipe(
      tap((res) => {
        const duration = Date.now() - now;
        this.logger.log(` ${method} ${url} [${duration}ms]`);
        if (process.env.DEBUG == 'yes')
          this.logger.debug(
            `${JSON.stringify({ method: method, url: url, body: sanitizedBody, response: res.data })}`,
          );
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        this.logger.error(
          ` ${method} ${url} [${duration}ms] Error: ${error.message}`,
        );
        if (process.env.DEBUG == 'yes')
          this.logger.debug(
            ` ${JSON.stringify({ method: method, url: url, body: sanitizedBody })}`,
          );

        return throwError(() => error);
      }),
    );
  }
}
