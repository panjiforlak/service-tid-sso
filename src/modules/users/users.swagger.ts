import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';

export const ApiUsersTags = () => applyDecorators(ApiTags('Users'));

export const ApiUsersBearer = () => applyDecorators(ApiBearerAuth('jwt'));

export const ApiGetProfile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get user profile',
      description: 'Get current user profile information (requires authentication)',
    }),
    ApiUsersBearer(),
    ApiResponse({
      status: 200,
      description: 'Profile retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Profile retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              full_name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john.doe@example.com' },
              username: { type: 'string', example: 'johndoe123' },
              is_active: { type: 'boolean', example: true },
              email_verified: { type: 'boolean', example: false },
              role: { type: 'string', example: 'user' },
              permissions: {
                type: 'array',
                items: { type: 'string' },
                example: ['read', 'write', 'update', 'delete'],
              },
              avatar_url: {
                type: 'string',
                example: 'https://s3.amazonaws.com/bucket/avatar/123.jpg',
                description: 'User profile picture URL',
              },
              created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
              updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
              last_login: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid token',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );

export const ApiUpdateProfile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update user profile',
      description: 'Update current user profile information (requires authentication)',
    }),
    ApiUsersBearer(),
    ApiBody({
      description: 'Profile update data',
      schema: {
        type: 'object',
        properties: {
          full_name: {
            type: 'string',
            example: 'John Updated Doe',
            description: 'Updated full name',
            minLength: 2,
            maxLength: 100,
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.updated@example.com',
            description: 'Updated email address',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Profile updated successfully',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Profile updated successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              full_name: { type: 'string', example: 'John Updated Doe' },
              email: { type: 'string', example: 'john.updated@example.com' },
              username: { type: 'string', example: 'johndoe123' },
              role: { type: 'string', example: 'user' },
              updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
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
                example: ['Email must be a valid email address', 'Full name must be at least 2 characters'],
              },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );

export const ApiUploadAvatar = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload user avatar',
      description: 'Upload user profile picture (requires authentication)',
    }),
    ApiUsersBearer(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Avatar file upload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file (jpg, jpeg, png, gif) - Max size: 5MB',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Avatar uploaded successfully',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Avatar uploaded successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              avatar_url: {
                type: 'string',
                example: 'https://s3.amazonaws.com/bucket/avatar/123.jpg',
                description: 'URL of the uploaded avatar',
              },
              file_size: {
                type: 'number',
                example: 1024000,
                description: 'File size in bytes',
              },
              file_type: {
                type: 'string',
                example: 'image/jpeg',
                description: 'MIME type of the uploaded file',
              },
              updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid file',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Invalid file type. Only jpg, jpeg, png, gif are allowed' },
          data: {
            type: 'object',
            properties: {
              error: { type: 'boolean', example: true },
              allowed_types: {
                type: 'array',
                items: { type: 'string' },
                example: ['image/jpeg', 'image/png', 'image/gif'],
              },
              max_size: { type: 'string', example: '5MB' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
    ApiResponse({
      status: 413,
      description: 'File too large',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 413 },
          message: { type: 'string', example: 'File too large' },
          data: {
            type: 'object',
            properties: {
              error: { type: 'boolean', example: true },
              max_size: { type: 'string', example: '5MB' },
              current_size: { type: 'string', example: '10MB' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );

export const ApiDeleteAvatar = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete user avatar',
      description: 'Delete user profile picture (requires authentication)',
    }),
    ApiUsersBearer(),
    ApiResponse({
      status: 200,
      description: 'Avatar deleted successfully',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Avatar deleted successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              avatar_url: { type: 'null', example: null },
              deleted_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not found - no avatar to delete',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'No avatar found' },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );
