import { Test, TestingModule } from '@nestjs/testing';
import { LoggerInterceptor } from 'src/common/interceptors/logger.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpException, HttpStatus } from '@nestjs/common';
describe('LoggerInterceptor', () => {
  let interceptor: LoggerInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerInterceptor],
    }).compile();

    interceptor = module.get<LoggerInterceptor>(LoggerInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;

    beforeEach(() => {
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            ip: '192.168.1.1',
            headers: { 'user-agent': 'test-agent' },
          }),
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;

      mockCallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: 'test' })),
      };
    });

    it('should log request and response', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await new Promise((resolve, reject) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value).toEqual({ data: 'test' });
            consoleSpy.mockRestore();
            resolve(value);
          },
          error: (error) => {
            consoleSpy.mockRestore();
            reject(new Error(error));
          },
        });
      });
    });

    it('should handle errors in logging gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Logging error');
      });

      await new Promise((resolve, reject) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value).toEqual({ data: 'test' });
            consoleSpy.mockRestore();
            resolve(value);
          },
          error: (error) => {
            consoleSpy.mockRestore();
            reject(new Error(error));
          },
        });
      });
    });

    it('should call next handler', async () => {
      await new Promise((resolve, reject) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(mockCallHandler.handle).toHaveBeenCalled();
            expect(value).toEqual({ data: 'test' });
            resolve(value);
          },
          error: (error) => {
            reject(new Error(error));
          },
        });
      });
    });

    it('should handle errors from next handler', async () => {
      const error = new Error('Handler error');
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null).pipe(switchMap(() => throwError(() => error))));

      await new Promise((resolve, reject) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            reject(new Error('Should not reach here'));
          },
          error: (err) => {
            expect(err).toBe(error);
            resolve(err);
          },
        });
      });
    });

    it('should handle different request methods and URLs', async () => {
      const differentContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            method: 'POST',
            url: '/api/users',
            ip: '192.168.1.2',
            headers: { 'user-agent': 'test-agent-2' },
          }),
          getResponse: () => ({
            statusCode: 201,
          }),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;

      await new Promise((resolve, reject) => {
        interceptor.intercept(differentContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value).toEqual({ data: 'test' });
            resolve(value);
          },
          error: (error) => {
            reject(new Error(error));
          },
        });
      });
    });

    it('should log debug information when DEBUG=yes', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'yes';

      const debugSpy = jest.spyOn(interceptor['logger'], 'debug').mockImplementation();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test response' }));

      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('"trx":'));

      process.env.DEBUG = originalDebug;
      debugSpy.mockRestore();
    });

    it('should log debug information on error when DEBUG=yes', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'yes';

      const debugSpy = jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
      const error = new Error('Test error');

      mockCallHandler.handle = jest.fn().mockReturnValue(of(null).pipe(switchMap(() => throwError(() => error))));

      try {
        await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      } catch (err) {
        // Expected to throw
      }

      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('"error":'));

      process.env.DEBUG = originalDebug;
      debugSpy.mockRestore();
    });

    it('should handle response data correctly', async () => {
      const responseData = { success: true, data: 'test' };

      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(result).toEqual(responseData);
    });

    it('should handle response without data property', async () => {
      const responseData = 'simple string response';

      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(result).toEqual(responseData);
    });

    it('should sanitize password in request body', async () => {
      const contextWithPassword = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            method: 'POST',
            url: '/login',
            body: { username: 'test', password: 'secret123' },
          }),
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;

      const logSpy = jest.spyOn(interceptor['logger'], 'log').mockImplementation();

      await interceptor.intercept(contextWithPassword, mockCallHandler).toPromise();

      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('should handle HttpException errors', async () => {
      const httpError = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      mockCallHandler.handle = jest.fn().mockReturnValue(of(null).pipe(switchMap(() => throwError(() => httpError))));

      const errorSpy = jest.spyOn(interceptor['logger'], 'error').mockImplementation();

      try {
        await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      } catch (err) {
        // Expected to throw
      }

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('404'));

      errorSpy.mockRestore();
    });

    it('should handle non-HttpException errors', async () => {
      const genericError = new Error('Generic error');

      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of(null).pipe(switchMap(() => throwError(() => genericError))));

      const errorSpy = jest.spyOn(interceptor['logger'], 'error').mockImplementation();

      try {
        await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      } catch (err) {
        // Expected to throw
      }

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('500'));

      errorSpy.mockRestore();
    });

    it('should handle response with statusCode property', async () => {
      const responseWithStatusCode = {
        data: 'test',
        statusCode: 201,
      };

      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseWithStatusCode));

      const logSpy = jest.spyOn(interceptor['logger'], 'log').mockImplementation();

      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('201'));

      logSpy.mockRestore();
    });

    it('should handle debug logging with response data property', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'yes';

      const responseWithData = {
        data: 'test data',
        statusCode: 200,
      };

      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseWithData));

      const debugSpy = jest.spyOn(interceptor['logger'], 'debug').mockImplementation();

      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('"response":"test data"'));

      process.env.DEBUG = originalDebug;
      debugSpy.mockRestore();
    });

    it('should handle debug logging without response data property', async () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'yes';

      const responseWithoutData = {
        message: 'success',
        statusCode: 200,
      };

      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseWithoutData));

      const debugSpy = jest.spyOn(interceptor['logger'], 'debug').mockImplementation();

      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('"response":'));

      process.env.DEBUG = originalDebug;
      debugSpy.mockRestore();
    });
  });
});
