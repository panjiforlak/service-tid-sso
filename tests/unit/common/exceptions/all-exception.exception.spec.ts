import { Test, TestingModule } from '@nestjs/testing';
import { AllExceptionsFilter, RateLimiter } from 'src/common/exceptions/all-exception.exception';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

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
    let mockResponse: any;
    let mockRequest: any;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockRequest = {
        url: '/test',
        method: 'GET',
      };

      mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as any;
    });

    it('should handle HttpException', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle generic Error', () => {
      const exception = new Error('Generic error');
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle unknown exception', () => {
      const exception = 'Unknown error';
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should include trxId in response', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);
      
      const responseCall = mockResponse.json.mock.calls[0][0];
      
      expect(responseCall.trxId).toBeDefined();
      expect(typeof responseCall.trxId).toBe('string');
      expect(responseCall.trxId).toMatch(/^TID/);
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException({ message: 'Object error', statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Object error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with existing trxId', () => {
      const exception = new HttpException({ message: 'Error with trxId', trxId: 'TID123456' }, HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error with trxId',
        data: { error: true },
        trxId: 'TID123456',
      });
    });

    it('should handle HttpException with existing statusCode', () => {
      const exception = new HttpException({ message: 'Error with statusCode', statusCode: 422 }, HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Error with statusCode',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with existing data', () => {
      const exception = new HttpException({ message: 'Error with data', data: { field: 'value' } }, HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error with data',
        data: { field: 'value' },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with missing message (fallback to Unknown error)', () => {
      const exception = new HttpException({ statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Unknown error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with empty message (fallback to Unknown error)', () => {
      const exception = new HttpException({ message: '', statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Unknown error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with null message (fallback to Unknown error)', () => {
      const exception = new HttpException({ message: null, statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Unknown error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with undefined message (fallback to Unknown error)', () => {
      const exception = new HttpException({ message: undefined, statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Unknown error',
        data: { error: true },
        trxId: expect.any(String),
      });
    });
  });
});

describe('RateLimiter', () => {
  let filter: RateLimiter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimiter],
    }).compile();

    filter = module.get<RateLimiter>(RateLimiter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    let mockResponse: any;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
        }),
      } as any;
    });

    it('should handle ThrottlerException', () => {
      const exception = new ThrottlerException();
      
      filter.catch(exception, mockArgumentsHost);
      
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 429,
        message: 'You are suspected of fraud!.',
        error: 'Too Many Requests',
      });
    });
  });
});
