import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from 'src/common/shared/http/interceptors/global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      headers: {},
      trxId: undefined,
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException with trxId from header', () => {
    const exception = new HttpException({ message: 'Bad Request', error: true }, HttpStatus.BAD_REQUEST);

    mockRequest.headers['x-transaction-id'] = 'trx-123';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Bad Request',
      error: true,
      trxId: 'trx-123',
    });
  });

  it('should handle HttpException with trxId from request.trxId', () => {
    const exception = new HttpException({ message: 'Unauthorized' }, HttpStatus.UNAUTHORIZED);

    mockRequest.trxId = 'trx-456';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Unauthorized',
      trxId: 'trx-456',
    });
  });

  it('should handle unknown error as Internal Server Error', () => {
    const exception = new Error('Something broke');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
      trxId: undefined,
    });
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Forbidden', 403);

    mockRequest.headers['x-transaction-id'] = 'trx-789';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Forbidden',
      trxId: 'trx-789',
    });
  });
});
