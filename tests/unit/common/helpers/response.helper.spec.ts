import { successResponse, throwError, errorResponse, paginateResponse } from 'src/common/helpers/response.helper';
import { HttpException } from '@nestjs/common';

describe('ResponseHelper', () => {
  describe('successResponse', () => {
    it('should return success response with data and message', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Success message';

      const result = successResponse(data, message);

      expect(result).toEqual({
        statusCode: 200,
        message,
        data,
        trxId: expect.any(String),
      });
    });

    it('should return success response with data only', () => {
      const data = { id: 1, name: 'test' };

      const result = successResponse(data);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Retrieve data success',
        data,
        trxId: expect.any(String),
      });
    });

    it('should return success response with null data', () => {
      const result = successResponse(null);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Retrieve data success',
        data: null,
        trxId: expect.any(String),
      });
    });

    it('should include trxId in response', () => {
      const result = successResponse({});

      expect(result.trxId).toBeDefined();
      expect(typeof result.trxId).toBe('string');
      expect(result.trxId).toMatch(/^TID/);
    });

    it('should use default message and statusCode when not provided', () => {
      const data = { id: 1, name: 'test' };

      const result = successResponse(data);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Retrieve data success',
        data,
        trxId: expect.any(String),
      });
    });

    it('should use default statusCode when only message is provided', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Custom message';

      const result = successResponse(data, message);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Custom message',
        data,
        trxId: expect.any(String),
      });
    });
  });

  describe('errorResponse', () => {
    it('should return error response with default values', () => {
      const result = errorResponse();

      expect(result).toEqual({
        statusCode: 400,
        message: 'Error',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should return error response with custom values', () => {
      const message = 'Custom error';
      const statusCode = 500;
      const extra = { field: 'value' };

      const result = errorResponse(message, statusCode, true, extra);

      expect(result).toEqual({
        statusCode: 500,
        message: 'Custom error',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
        field: 'value',
      });
    });

    it('should include extra fields in response', () => {
      const extra = {
        code: 'VALIDATION_ERROR',
        details: { field: 'email', message: 'Invalid format' },
      };

      const result = errorResponse('Validation failed', 422, true, extra);

      expect(result).toMatchObject({
        statusCode: 422,
        message: 'Validation failed',
        error: true,
        code: 'VALIDATION_ERROR',
        details: { field: 'email', message: 'Invalid format' },
      });
    });

    it('should handle null extra parameter', () => {
      const result = errorResponse('Error message', 400, true, null as any);

      expect(result).toEqual({
        statusCode: 400,
        message: 'Error message',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should handle undefined extra parameter', () => {
      const result = errorResponse('Error message', 400, true, undefined);

      expect(result).toEqual({
        statusCode: 400,
        message: 'Error message',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should handle empty object extra parameter', () => {
      const result = errorResponse('Error message', 400, true, {});

      expect(result).toEqual({
        statusCode: 400,
        message: 'Error message',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should use default values for message, statusCode, and error when not provided', () => {
      const result = errorResponse();

      expect(result).toEqual({
        statusCode: 400,
        message: 'Error',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should use default values for statusCode and error when only message is provided', () => {
      const result = errorResponse('Custom error message');

      expect(result).toEqual({
        statusCode: 400,
        message: 'Custom error message',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should use default value for error when message and statusCode are provided', () => {
      const result = errorResponse('Custom error message', 500);

      expect(result).toEqual({
        statusCode: 500,
        message: 'Custom error message',
        error: true,
        trxId: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });

  describe('paginateResponse', () => {
    it('should return paginated response with default values', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const total = 2;

      const result = paginateResponse(data, total);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Success',
        data: data,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        trxId: expect.any(String),
      });
    });

    it('should return paginated response with custom values', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const total = 25;
      const page = 2;
      const limit = 10;
      const message = 'Data retrieved successfully';
      const statusCode = 200;

      const result = paginateResponse(data, total, page, limit, message, statusCode);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: data,
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
        trxId: expect.any(String),
      });
    });

    it('should calculate total pages correctly', () => {
      const data = [];
      const total = 100;
      const limit = 15;

      const result = paginateResponse(data, total, 1, limit);

      expect(result.meta.totalPages).toBe(7); // Math.ceil(100/15) = 7
    });

    it('should handle zero total', () => {
      const data = [];
      const total = 0;

      const result = paginateResponse(data, total);

      expect(result.meta.totalPages).toBe(0);
    });

    it('should use default values for page, limit, message, and statusCode', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const total = 2;

      const result = paginateResponse(data, total);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Success',
        data: data,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        trxId: expect.any(String),
      });
    });

    it('should use default values for message and statusCode when page and limit are provided', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const total = 2;
      const page = 2;
      const limit = 5;

      const result = paginateResponse(data, total, page, limit);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Success',
        data: data,
        meta: {
          total: 2,
          page: 2,
          limit: 5,
          totalPages: 1,
        },
        trxId: expect.any(String),
      });
    });
  });

  describe('throwError', () => {
    it('should throw HttpException with default status', () => {
      const message = 'Error message';

      expect(() => throwError(message)).toThrow(HttpException);
      expect(() => throwError(message)).toThrow(message);
    });

    it('should throw HttpException with custom status', () => {
      const message = 'Not found';
      const status = 404;

      expect(() => throwError(message, status)).toThrow(HttpException);
      expect(() => throwError(message, status)).toThrow(message);
    });

    it('should throw HttpException with 400 status by default', () => {
      const message = 'Bad request';

      try {
        throwError(message);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(400);
      }
    });

    it('should throw HttpException with custom status code', () => {
      const message = 'Unauthorized';
      const status = 401;

      try {
        throwError(message, status);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(401);
      }
    });

    it('should throw HttpException with default status code when not provided', () => {
      const message = 'Default error';

      try {
        throwError(message);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(400); // HttpStatus.BAD_REQUEST
      }
    });

    it('should throw HttpException with default message when not provided', () => {
      try {
        throwError();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(400);
        expect(error.getResponse()).toEqual({
          message: 'Bad Request',
          trxId: expect.any(String),
        });
      }
    });

    it('should throw HttpException with both default parameters', () => {
      try {
        throwError();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(400);
        expect(error.getResponse()).toEqual({
          message: 'Bad Request',
          trxId: expect.any(String),
        });
      }
    });
  });
});
