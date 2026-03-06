import {
  generateTrxId,
  successResponse,
  errorResponse,
  paginateResponse,
  throwError,
  toCustomUpperCase,
  gmtToOffset,
  toLocalISOString,
} from 'src/common/shared/helpers/common.helpers';
import { HttpStatus } from '@nestjs/common';

describe('CommonHelper', () => {
  describe('generateTrxId', () => {
    it('should generate a transaction ID with correct format', () => {
      const trxId = generateTrxId();

      // Should be a string
      expect(typeof trxId).toBe('string');

      // Should start with 'ITI'
      expect(trxId).toMatch(/^ITI/);

      // Should have correct length (ITI + mode + date + random)
      expect(trxId).toHaveLength(25);

      // Should contain only alphanumeric characters after ITI
      expect(trxId.substring(3)).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate unique transaction IDs', () => {
      const trxId1 = generateTrxId();
      const trxId2 = generateTrxId();

      expect(trxId1).not.toBe(trxId2);
    });

    it('should generate multiple unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateTrxId());
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(100);
    });

    it('should generate ID with custom prefix', () => {
      const trxId = generateTrxId('CUSTOM');

      expect(trxId).toMatch(/^CUSTOM/);
      expect(trxId).toHaveLength(28);
    });

    it('should generate ID with production mode when NODE_ENV is production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const trxId = generateTrxId();

      expect(trxId).toMatch(/^ITIPRD/);
      expect(trxId).toHaveLength(25);

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should generate ID with development mode by default', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const trxId = generateTrxId();

      expect(trxId).toMatch(/^ITIDEV/);
      expect(trxId).toHaveLength(25);

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('successResponse', () => {
    it('should return success response with default values', () => {
      const data = { id: 1, name: 'Test' };
      const result = successResponse(data);

      expect(result).toMatchObject({
        statusCode: HttpStatus.OK,
        message: 'Retrieve data success',
        data,
        timestamp: expect.any(String),
      });
    });

    it('should return success response with custom message and statusCode', () => {
      const data = { id: 1 };
      const result = successResponse(data, 'Custom message', HttpStatus.CREATED);

      expect(result).toMatchObject({
        statusCode: HttpStatus.CREATED,
        message: 'Custom message',
        data,
        timestamp: expect.any(String),
      });
    });

    it('should return success response with timezone when tz is provided', () => {
      const data = { id: 1 };
      const result = successResponse(data, 'Success', HttpStatus.OK, 'Asia/Jakarta');

      expect(result).toMatchObject({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data,
        timestamp: expect.any(String),
        timezone: {
          offsetZone: 'ASIA/JAKARTA',
          timeLocal: expect.any(String),
        },
      });
    });

    it('should not include timezone when tz is not provided', () => {
      const data = { id: 1 };
      const result = successResponse(data);

      expect(result).not.toHaveProperty('timezone');
    });
  });

  describe('errorResponse', () => {
    it('should return error response with default values', () => {
      const result = errorResponse();

      expect(result).toMatchObject({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error',
        error: true,
        timestamp: expect.any(String),
      });
    });

    it('should return error response with custom message and statusCode', () => {
      const result = errorResponse('Custom error', HttpStatus.NOT_FOUND);

      expect(result).toMatchObject({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Custom error',
        error: true,
        timestamp: expect.any(String),
      });
    });

    it('should return error response with extra fields', () => {
      const extra = { field1: 'value1', field2: 'value2' };
      const result = errorResponse('Error', HttpStatus.BAD_REQUEST, extra);

      expect(result).toMatchObject({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error',
        error: true,
        timestamp: expect.any(String),
        field1: 'value1',
        field2: 'value2',
      });
    });

    it('should return error response without extra fields when extra is empty', () => {
      const result = errorResponse('Error', HttpStatus.BAD_REQUEST, {});

      expect(result).toMatchObject({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error',
        error: true,
        timestamp: expect.any(String),
      });
    });
  });

  describe('paginateResponse', () => {
    it('should return paginated response with default values', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = paginateResponse(data, 2);

      expect(result).toMatchObject({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return paginated response with custom values', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = paginateResponse(data, 25, 2, 5, 'Custom message', HttpStatus.OK);

      expect(result).toMatchObject({
        statusCode: HttpStatus.OK,
        message: 'Custom message',
        data,
        meta: {
          total: 25,
          page: 2,
          limit: 5,
          totalPages: 5,
        },
      });
    });

    it('should calculate totalPages correctly when total is not divisible by limit', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = paginateResponse(data, 25, 1, 10);

      expect(result).toMatchObject({
        meta: {
          totalPages: 3, // Math.ceil(25/10) = 3
        },
      });
    });

    it('should handle empty data array', () => {
      const result = paginateResponse([], 0);

      expect(result).toMatchObject({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
    });
  });

  describe('throwError', () => {
    it('should throw HttpException with default values', () => {
      expect(() => throwError()).toThrow();
      try {
        throwError();
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.response).toMatchObject({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
          error: true,
        });
      }
    });

    it('should throw HttpException with custom message and statusCode', () => {
      try {
        throwError('Not found', 'Source', 'Context', HttpStatus.NOT_FOUND);
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.response).toMatchObject({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Not found',
          error: true,
        });
        expect(error.source).toBe('Source');
        expect(error.context).toBe('Context');
      }
    });

    it('should throw HttpException with extra fields', () => {
      const extra = { field1: 'value1' };
      try {
        throwError('Error', 'Source', 'Context', HttpStatus.BAD_REQUEST, extra);
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.response).toMatchObject({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Error',
          error: true,
          field1: 'value1',
        });
      }
    });
  });

  describe('toCustomUpperCase', () => {
    it('should convert camelCase to UPPER_SNAKE_CASE', () => {
      expect(toCustomUpperCase('camelCase')).toBe('CAMEL_CASE');
      expect(toCustomUpperCase('myVariableName')).toBe('MY_VARIABLE_NAME');
    });

    it('should handle strings with numbers', () => {
      expect(toCustomUpperCase('test123Value')).toBe('TEST123_VALUE');
      expect(toCustomUpperCase('value1Value2')).toBe('VALUE1_VALUE2');
    });

    it('should replace spaces and hyphens with underscores', () => {
      expect(toCustomUpperCase('test-value')).toBe('TEST_VALUE');
      expect(toCustomUpperCase('test value')).toBe('TEST_VALUE');
      expect(toCustomUpperCase('test-value name')).toBe('TEST_VALUE_NAME');
    });

    it('should handle already uppercase strings', () => {
      expect(toCustomUpperCase('ALREADY_UPPER')).toBe('ALREADY_UPPER');
    });

    it('should handle empty string', () => {
      expect(toCustomUpperCase('')).toBe('');
    });

    it('should handle single word', () => {
      expect(toCustomUpperCase('single')).toBe('SINGLE');
    });
  });

  describe('gmtToOffset', () => {
    it('should return offset for valid GMT timezone', () => {
      expect(gmtToOffset('GMT+7')).toBe(7);
      expect(gmtToOffset('GMT-5')).toBe(-5);
      expect(gmtToOffset('GMT+12')).toBe(12);
      expect(gmtToOffset('GMT-12')).toBe(-12);
    });

    it('should return 0 for invalid GMT timezone format', () => {
      expect(gmtToOffset('Asia/Jakarta')).toBe(0);
      expect(gmtToOffset('UTC')).toBe(0);
      expect(gmtToOffset('GMT')).toBe(0);
      expect(gmtToOffset('GMT+')).toBe(0);
      expect(gmtToOffset('GMT-')).toBe(0);
      expect(gmtToOffset('GMT+123')).toBe(0); // More than 2 digits
      expect(gmtToOffset('')).toBe(0);
    });

    it('should handle single digit offsets', () => {
      expect(gmtToOffset('GMT+1')).toBe(1);
      expect(gmtToOffset('GMT-1')).toBe(-1);
    });
  });

  describe('toLocalISOString', () => {
    it('should convert UTC ISO string to local time with GMT offset', () => {
      const utcIso = '2024-01-01T00:00:00.000Z';
      const result = toLocalISOString(utcIso, 'GMT+7');

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result).not.toContain('T');
      expect(result).toHaveLength(19);
    });

    it('should handle negative GMT offset', () => {
      const utcIso = '2024-01-01T12:00:00.000Z';
      const result = toLocalISOString(utcIso, 'GMT-5');

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result).toHaveLength(19);
    });

    it('should handle GMT+0 (UTC)', () => {
      const utcIso = '2024-01-01T00:00:00.000Z';
      const result = toLocalISOString(utcIso, 'GMT+0');

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result).toHaveLength(19);
    });

    it('should handle invalid timezone format (falls back to UTC)', () => {
      const utcIso = '2024-01-01T00:00:00.000Z';
      const result = toLocalISOString(utcIso, 'Asia/Jakarta');

      // Should still return valid format even with invalid timezone
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result).toHaveLength(19);
    });
  });
});
