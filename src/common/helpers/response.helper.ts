import { HttpException, HttpStatus } from '@nestjs/common';
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

export function successResponse<T = any>(
  data: T,
  message = 'Retrieve data success',
  statusCode = 200,
): ApiResponse<T> {
  return {
    statusCode,
    message,
    data,
  };
}

export function errorResponse(
  message = 'Error',
  statusCode = 400,
  error = true,
  extra?: Record<string, any>,
) {
  return {
    statusCode,
    message,
    error,
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
  };
}

export const throwError = (
  message = 'Bad Request',
  statusCode = HttpStatus.BAD_REQUEST,
): never => {
  throw new HttpException(
    {
      message,
    },
    statusCode,
  );
};
