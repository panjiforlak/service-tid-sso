import { HttpException, HttpStatus } from '@nestjs/common';
import { generateTrxId } from './common.helper';
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  trxId?: string;
}

export function successResponse<T = any>(data: T, message = 'Retrieve data success', statusCode = 200): ApiResponse<T> {
  return {
    statusCode,
    message,
    data,
    trxId: generateTrxId(),
  };
}

export function errorResponse(message = 'Error', statusCode = 400, error = true, extra?: Record<string, any>) {
  return {
    statusCode,
    message,
    error,
    trxId: generateTrxId(),
    ...(extra || {}),
    timestamp: new Date().toISOString(),
  };
}

export function paginateResponse<T = any>(
  data: T[],
  total: number,
  page = 1,
  limit = 10,
  message = 'Success',
  statusCode = 200,
) {
  const totalPages = Math.ceil(total / limit);
  return {
    statusCode,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
    trxId: generateTrxId(),
  };
}

export function throwError(message = 'Bad Request', statusCode: number = HttpStatus.BAD_REQUEST): never {
  throw new HttpException({ message, trxId: generateTrxId() }, statusCode);
}
