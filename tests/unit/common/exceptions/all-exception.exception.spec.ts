import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AllExceptionsFilter } from 'src/common/shared/http/filters/all-exception.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
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

    it('should handle HttpException with string message', () => {
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

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Object error', statusCode: 422 },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Object error',
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

    it('should handle unknown string exception', () => {
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

    it('should handle HttpException with existing statusCode and message', () => {
      const exception = new HttpException(
        { message: 'Error with statusCode', statusCode: 422 },
        HttpStatus.BAD_REQUEST,
      );

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
      const exception = new HttpException(
        { message: 'Error with data', data: { field: 'value' } },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error with data',
        data: { field: 'value' },
        trxId: expect.any(String),
      });
    });

    it('should handle HttpException with missing or empty message', () => {
      const exception1 = new HttpException({ statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      const exception2 = new HttpException({ message: '', statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      const exception3 = new HttpException({ message: null, statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);
      const exception4 = new HttpException({ message: undefined, statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY);

      [exception1, exception2, exception3, exception4].forEach((ex) => {
        filter.catch(ex, mockArgumentsHost);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 422,
            message: 'Unknown error',
            data: { error: true },
            trxId: expect.any(String),
          }),
        );
      });
    });
  });
});

describe('ThrottlerException Handling', () => {
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

  it('should handle ThrottlerException correctly', () => {
    const exception = new ThrottlerException();
    const filter = new AllExceptionsFilter();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 429,
      message: 'You are suspected of fraud!.',
      data: { info: 'Too Many Requestsss' },
      trxId: expect.any(String),
    });
  });
});
