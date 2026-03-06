import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AllExceptionsFilter } from 'src/common/shared/http/filters/all-exception.filter';
import { ThrottlerExceptionFilter } from 'src/common/shared/http/filters/throttler-exception.filter';
import { PinoLogger } from 'nestjs-pino';

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
};

function createHttpArgumentsHost(
  params?: {
    request?: Partial<{
      url: string;
      method: string;
      originalUrl: string;
      ip: string;
      headers: Record<string, any>;
    }>;
    response?: MockResponse;
  },
) {
  const response: MockResponse =
    params?.response ??
    ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any);

  const request =
    params?.request ??
    ({
      url: '/test',
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      headers: {},
    } as any);

  const host: ArgumentsHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as any;

  return { host, request, response };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should include trxId in response', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, host);

      const responseCall = response.json.mock.calls[0][0];

      expect(responseCall.trxId).toBeDefined();
      expect(typeof responseCall.trxId).toBe('string');
      expect(responseCall.trxId).toMatch(/^ITI(DEV|PRD)/);
    });

    it('should use x-transaction-id header as trxId when present', () => {
      const { host, response } = createHttpArgumentsHost({
        request: { headers: { 'x-transaction-id': 'ITI123456' } as any },
      });
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, host);

      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        data: { error: true },
        trxId: 'ITI123456',
      });
    });

    it('should handle HttpException with string response', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException('String error message', HttpStatus.BAD_REQUEST);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'String error message',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with object response', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException(
        { message: 'Object error', statusCode: 422 },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Object error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with existing statusCode', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException(
        { message: 'Error with statusCode', statusCode: 422 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Error with statusCode',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with existing data', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException(
        { message: 'Error with data', data: { field: 'value' } },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error with data',
        data: { field: 'value' },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with missing message (fallback to Unknown error)', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException({ statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with empty message (fallback to Error)', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException({ message: '', statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with null message (fallback to Error)', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException({ message: null, statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with undefined message (fallback to Error)', () => {
      const { host, response } = createHttpArgumentsHost();
      const exception = new HttpException({ message: undefined, statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });
  });
});

describe('ThrottlerExceptionFilter', () => {
  let filter: ThrottlerExceptionFilter;
  let logger: PinoLogger;

  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThrottlerExceptionFilter,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<ThrottlerExceptionFilter>(ThrottlerExceptionFilter);
    logger = module.get<PinoLogger>(PinoLogger);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle ThrottlerException and log warning', () => {
      const { host, response, request } = createHttpArgumentsHost({
        request: {
          method: 'POST',
          originalUrl: '/api/test',
          ip: '127.0.0.1',
          headers: {
            'user-agent': 'test-agent',
          },
        } as any,
      });
      const exception = new ThrottlerException();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too Many Requests',
        data: { error: true },
        trxId: expect.any(String),
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        {
          traceId: expect.any(String),
          method: 'POST',
          path: '/api/test',
          statusCode: 429,
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        },
        'API_ABUSE_DETECTED',
      );
    });

    it('should use x-transaction-id header as trxId when present', () => {
      const { host, response } = createHttpArgumentsHost({
        request: {
          headers: { 'x-transaction-id': 'ITI123456' },
          method: 'GET',
          originalUrl: '/test',
          ip: '127.0.0.1',
        } as any,
      });
      const exception = new ThrottlerException();

      filter.catch(exception, host);

      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too Many Requests',
        data: { error: true },
        trxId: 'ITI123456',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          traceId: 'ITI123456',
        }),
        'API_ABUSE_DETECTED',
      );
    });

    it('should generate trxId when x-transaction-id header is not present', () => {
      const { host, response } = createHttpArgumentsHost({
        request: {
          headers: {},
          method: 'GET',
          originalUrl: '/test',
          ip: '127.0.0.1',
        } as any,
      });
      const exception = new ThrottlerException();

      filter.catch(exception, host);

      const responseCall = response.json.mock.calls[0][0];
      expect(responseCall.trxId).toBeDefined();
      expect(typeof responseCall.trxId).toBe('string');
      expect(responseCall.trxId).toMatch(/^ITI(DEV|PRD)/);
    });
  });
});

describe('AllExceptionsFilter - ThrottlerException handling', () => {
  let filter: AllExceptionsFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  it('should handle ThrottlerException via AllExceptionsFilter', () => {
    const { host, response } = createHttpArgumentsHost();
    const exception = new ThrottlerException();

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 429,
      message: 'Too Many Requests',
      data: { error: true },
      trxId: expect.any(String),
    });
  });
});
