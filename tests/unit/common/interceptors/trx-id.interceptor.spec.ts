import { Test, TestingModule } from '@nestjs/testing';
import { TrxIdInterceptor } from 'src/common/shared/http/interceptors/trx-id.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('TrxIdInterceptor', () => {
  let interceptor: TrxIdInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrxIdInterceptor],
    }).compile();

    interceptor = module.get<TrxIdInterceptor>(TrxIdInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;
    let mockResponse: any;

    beforeEach(() => {
      mockResponse = {
        header: jest.fn(),
        setHeader: jest.fn(),
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            headers: {},
          }),
          getResponse: () => mockResponse,
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

    it('should set x-transaction-id header when header is not present', async () => {
      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(mockResponse.header).toHaveBeenCalledWith('x-transaction-id', expect.stringMatching(/^ITI(DEV|PRD)/));
            expect(value).toEqual({ data: 'test', trxId: expect.stringMatching(/^ITI(DEV|PRD)/) });
            resolve(value);
          },
        });
      });
    });

    it('should use x-transaction-id header when present', async () => {
      const contextWithHeader = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            headers: { 'x-transaction-id': 'ITI123456' },
          }),
          getResponse: () => mockResponse,
        }),
      } as any;

      await new Promise((resolve) => {
        interceptor.intercept(contextWithHeader, mockCallHandler).subscribe({
          next: (value) => {
            expect(mockResponse.header).toHaveBeenCalledWith('x-transaction-id', 'ITI123456');
            expect(value).toEqual({ data: 'test', trxId: 'ITI123456' });
            resolve(value);
          },
        });
      });
    });

    it('should inject trxId into response body when data is object', async () => {
      const responseData = { success: true, message: 'OK' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value).toHaveProperty('trxId');
            expect(value.trxId).toMatch(/^ITI(DEV|PRD)/);
            expect(value.success).toBe(true);
            expect(value.message).toBe('OK');
            resolve(value);
          },
        });
      });
    });

    it('should not inject trxId when data already has trxId', async () => {
      const responseData = { success: true, trxId: 'EXISTING_TRX_ID' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value.trxId).toBe('EXISTING_TRX_ID');
            expect(mockResponse.header).toHaveBeenCalled();
            resolve(value);
          },
        });
      });
    });

    it('should not inject trxId when data is not an object', async () => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of('string response'));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value).toBe('string response');
            expect(mockResponse.header).toHaveBeenCalled();
            resolve(value);
          },
        });
      });
    });

    it('should not inject trxId when data is null', async () => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            expect(value).toBeNull();
            expect(mockResponse.header).toHaveBeenCalled();
            resolve(value);
          },
        });
      });
    });

    it('should handle array response', async () => {
      const responseData = [{ id: 1 }, { id: 2 }];
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      await new Promise((resolve) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: (value) => {
            // Arrays are objects, so trxId should be injected
            expect(value).toHaveProperty('trxId');
            expect(Array.isArray(value)).toBe(true);
            resolve(value);
          },
        });
      });
    });
  });
});
