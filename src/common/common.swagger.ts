import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export const ApiCommonTags = () => applyDecorators(ApiTags('Common'));

export const ApiCommonBearer = () => applyDecorators(ApiBearerAuth('jwt'));

export const ApiUnauthorizedResponse = () => applyDecorators(
  ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        data: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            reason: { type: 'string', example: 'Invalid or expired token' }
          }
        },
        trxId: { type: 'string', example: 'TID123456789' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
);

export const ApiForbiddenResponse = () => applyDecorators(
  ApiResponse({ 
    status: 403, 
    description: 'Forbidden - insufficient permissions',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden' },
        data: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            reason: { type: 'string', example: 'Insufficient permissions' },
            required_permissions: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['admin', 'write']
            }
          }
        },
        trxId: { type: 'string', example: 'TID123456789' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
);

export const ApiNotFoundResponse = () => applyDecorators(
  ApiResponse({ 
    status: 404, 
    description: 'Not found - resource not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Not found' },
        data: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            resource: { type: 'string', example: 'User' },
            resource_id: { type: 'string', example: '123' }
          }
        },
        trxId: { type: 'string', example: 'TID123456789' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
);

export const ApiBadRequestResponse = () => applyDecorators(
  ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Please check your account or password!' },
        data: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            validation: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Email must be a valid email address', 'Password must be at least 6 characters']
            },
            field_errors: {
              type: 'object',
              properties: {
                email: { type: 'array', items: { type: 'string' }, example: ['Email must be a valid email address'] },
                password: { type: 'array', items: { type: 'string' }, example: ['Password must be at least 6 characters'] }
              }
            }
          }
        },
        trxId: { type: 'string', example: 'TID123456789' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
);

export const ApiInternalServerErrorResponse = () => applyDecorators(
  ApiResponse({ 
    status: 500, 
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
        data: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            error_code: { type: 'string', example: 'INTERNAL_ERROR' },
            details: { type: 'string', example: 'Database connection failed' }
          }
        },
        trxId: { type: 'string', example: 'TID123456789' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
);

export const ApiTooManyRequestsResponse = () => applyDecorators(
  ApiResponse({ 
    status: 429, 
    description: 'Too many requests - rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'You are suspected of fraud!.' },
        error: { type: 'string', example: 'Too Many Requests' },
        data: {
          type: 'object',
          properties: {
            retry_after: { type: 'number', example: 60 },
            limit: { type: 'number', example: 100 },
            remaining: { type: 'number', example: 0 }
          }
        }
      }
    }
  })
);

export const ApiSuccessResponse = (description: string, dataSchema?: any) => applyDecorators(
  ApiResponse({ 
    status: 200, 
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: dataSchema || { type: 'object' },
        trxId: { type: 'string', example: 'TID123456789' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
);

export const ApiCreatedResponse = (description: string, dataSchema?: any) => applyDecorators(
  ApiResponse({ 
    status: 201, 
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Created successfully' },
        data: dataSchema || { type: 'object' },
        trxId: { type: 'string', example: 'TID123456789' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
);
