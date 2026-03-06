import { Test, TestingModule } from '@nestjs/testing';
import { LoggerInterceptor } from 'src/common/shared/http/interceptors/logger.interceptor';
import { CallHandler, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';
describe('LoggerInterceptor', () => {
  let interceptor: LoggerInterceptor;
  let logger: PinoLogger;

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerInterceptor,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    interceptor = module.get<LoggerInterceptor>(LoggerInterceptor);
    logger = module.get<PinoLogger>(PinoLogger);
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
            originalUrl: '/test',
            ip: '192.168.1.1',
            headers: { 'user-agent': 'test-agent' },
            body: {},
            query: {},
            params: {},
            id: 'req-id-123',
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

      // Reset mocks
      jest.clearAllMocks();
    });

    it('should log request and response successfully', async () => {
      await new Promise((resolve, reject) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value).toEqual({ data: 'test' });
            expect(mockLogger.info).toHaveBeenCalledWith(
              expect.objectContaining({
                traceId: expect.any(String),
                method: 'GET',
                path: '/test',
                statusCode: 200,
                responseTime: expect.stringMatching(/\d+ms/),
              }),
              'REQUEST_SUCCESS',
            );
            resolve(value);
          },
          error: (error) => {
            reject(new Error(error));
          },
        });
      });
    });

    it('should use x-transaction-id header as traceId when present', async () => {
      const contextWithTrxId = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            originalUrl: '/test',
            headers: { 'x-transaction-id': 'ITI123456' },
            body: {},
            query: {},
            params: {},
          }),
          getResponse: () => ({
            statusCode: 200,
          }),
        }),
      } as any;

      await new Promise((resolve) => {
        interceptor.intercept(contextWithTrxId, mockCallHandler).subscribe({
          next: () => {
            expect(mockLogger.info).toHaveBeenCalledWith(
              expect.objectContaining({
                traceId: 'ITI123456',
              }),
              'REQUEST_SUCCESS',
            );
            resolve(undefined);
          },
        });
      });
    });

    it('should use req.id as traceId when x-transaction-id is not present', async () => {
      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => {
            expect(mockLogger.info).toHaveBeenCalledWith(
              expect.objectContaining({
                traceId: 'req-id-123',
              }),
              'REQUEST_SUCCESS',
            );
            resolve(undefined);
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
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => {
            resolve(undefined);
          },
          error: (err) => {
            expect(err).toBe(error);
            expect(mockLogger.error).toHaveBeenCalledWith(
              expect.objectContaining({
                traceId: expect.any(String),
                method: 'GET',
                path: '/test',
                statusCode: 500,
                responseTime: expect.stringMatching(/\d+ms/),
                error: 'Handler error',
              }),
              expect.stringMatching(/FILE_NAME:||:FUNCTION_NAME/),
            );
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
            originalUrl: '/api/users',
            ip: '192.168.1.2',
            headers: { 'user-agent': 'test-agent-2' },
            body: {},
            query: {},
            params: {},
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
            expect(mockLogger.info).toHaveBeenCalledWith(
              expect.objectContaining({
                method: 'POST',
                path: '/api/users',
                statusCode: 201,
              }),
              'REQUEST_SUCCESS',
            );
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

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test response' }));

      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          traceId: expect.any(String),
          body: expect.any(Object),
          query: expect.any(Object),
          params: expect.any(Object),
        }),
      );

      process.env.DEBUG = originalDebug;
    });

    it('should not log info for statusCode >= 400', async () => {
      const contextWithError = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            originalUrl: '/test',
            headers: {},
            body: {},
            query: {},
            params: {},
          }),
          getResponse: () => ({
            statusCode: 404,
          }),
        }),
      } as any;

      await new Promise((resolve) => {
        interceptor.intercept(contextWithError, mockCallHandler).subscribe({
          next: () => {
            expect(mockLogger.info).not.toHaveBeenCalled();
            resolve(undefined);
          },
        });
      });
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
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'yes';

      const contextWithPassword = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            method: 'POST',
            url: '/login',
            originalUrl: '/login',
            headers: {},
            body: { username: 'test', password: 'secret123' },
            query: {},
            params: {},
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

      await interceptor.intercept(contextWithPassword, mockCallHandler).toPromise();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { username: 'test', password: '******' },
        }),
      );

      process.env.DEBUG = originalDebug;
    });

    it('should handle HttpException errors', async () => {
      const httpError = new HttpException('Not Found', HttpStatus.NOT_FOUND) as any;
      httpError.source = 'AUTH_SERVICE';
      httpError.context = 'VALIDATE_USER';

      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => httpError));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => resolve(undefined),
          error: () => {
            expect(mockLogger.error).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: 404,
                error: 'Not Found',
              }),
              'AUTH_SERVICE:||:VALIDATE_USER',
            );
            resolve(undefined);
          },
        });
      });
    });

    it('should handle non-HttpException errors', async () => {
      const genericError = new Error('Generic error');

      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => genericError));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => resolve(undefined),
          error: () => {
            expect(mockLogger.error).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: 500,
                error: 'Generic error',
              }),
              'FILE_NAME:||:FUNCTION_NAME',
            );
            resolve(undefined);
          },
        });
      });
    });

    it('should handle HttpException with response object', async () => {
      const httpError = new HttpException({ message: 'Error message', statusCode: 400 }, HttpStatus.BAD_REQUEST);

      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => httpError));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => resolve(undefined),
          error: () => {
            expect(mockLogger.error).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: 400,
                error: 'Error message',
              }),
              expect.any(String),
            );
            resolve(undefined);
          },
        });
      });
    });

    it('should handle error without source and context', async () => {
      const error = new Error('Error without source');
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => resolve(undefined),
          error: () => {
            expect(mockLogger.error).toHaveBeenCalledWith(
              expect.objectContaining({
                error: 'Error without source',
              }),
              'FILE_NAME:||:FUNCTION_NAME',
            );
            resolve(undefined);
          },
        });
      });
    });
  });
});
