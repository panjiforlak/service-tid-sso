import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export const ApiAuthTags = () => applyDecorators(ApiTags('Authentication'));
export const ApiAuthBearer = () => applyDecorators(ApiBearerAuth('jwt'));
export const ApiRegister = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register new user',
      description: 'Create a new user account with email and password',
    }),
    ApiBody({
      description: 'User registration data',
      schema: {
        type: 'object',
        properties: {
          full_name: {
            type: 'string',
            example: 'John Doe',
            description: 'Full name of the user',
            minLength: 2,
            maxLength: 100,
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
            description: 'Valid email address',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$',
          },
          username: {
            type: 'string',
            example: 'johndoe123',
            description: 'Unique username',
            minLength: 3,
            maxLength: 30,
            pattern: '^[a-zA-Z0-9_]+$',
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'SecurePass123!',
            description: 'Password with at least 6 characters',
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
          },
        },
        required: ['full_name', 'email', 'username', 'password'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User successfully registered',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 201 },
          message: { type: 'string', example: 'User registered successfully' },
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
              created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
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
                example: ['Email must be a valid email address', 'Password must be at least 6 characters'],
              },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - user already exists',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 409 },
          message: { type: 'string', example: 'User already exists' },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );

export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Authenticate user with email/username and password',
    }),
    ApiBody({
      description: 'Login credentials',
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            example: 'john.doe@example.com',
            description: 'Email or username for login',
          },
          password: {
            type: 'string',
            example: 'SecurePass123!',
            description: 'User password',
          },
        },
        required: ['email', 'password'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Login successfully!' },
          data: {
            type: 'object',
            properties: {
              access_token: {
                type: 'string',
                example: 'access_token_123456789',
                description: 'JWT access token',
              },
              refresh_token: {
                type: 'string',
                example: 'refresh_token_123456789',
                description: 'Refresh token for getting new access tokens',
              },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'invalid credentials',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Please check your account or password!' },
          data: { type: 'object', example: { error: true } },
          trxId: { type: 'string', example: 'TID123456789' },
        },
      },
    }),
    ApiResponse({
      status: 429,
      description: 'Rate Limit',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 429 },
          message: { type: 'string', example: 'You are suspected of fraud!.' },
          error: { type: 'object', example: 'Too Many Requests' },
          trxId: { type: 'string', example: 'TID123456789' },
        },
      },
    }),
  );

export const ApiForgotPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Forgot password',
      description: 'Send password reset email to user',
    }),
    ApiBody({
      description: 'Email for password reset',
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
            description: 'Email address to send reset link',
          },
        },
        required: ['email'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset email sent',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Password reset email sent' },
          data: {
            type: 'object',
            properties: {
              email: { type: 'string', example: 'john.doe@example.com' },
              reset_token: { type: 'string', example: 'reset_token_123456789' },
              expires_at: { type: 'string', format: 'date-time', example: '2024-01-01T01:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );

export const ApiResetPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Reset password',
      description: 'Reset user password using reset token',
    }),
    ApiBody({
      description: 'Password reset data',
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'reset_token_123456789',
            description: 'Password reset token from email',
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'NewSecurePass123!',
            description: 'New password',
          },
        },
        required: ['token', 'password'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset successful',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Password reset successful' },
          data: {
            type: 'object',
            properties: {
              user_id: { type: 'number', example: 1 },
              email: { type: 'string', example: 'john.doe@example.com' },
              updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );

export const ApiChangePassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Change password',
      description: 'Change user password (requires authentication)',
    }),
    ApiAuthBearer(),
    ApiBody({
      description: 'Password change data',
      schema: {
        type: 'object',
        properties: {
          current_password: {
            type: 'string',
            example: 'CurrentPass123!',
            description: 'Current password',
          },
          new_password: {
            type: 'string',
            minLength: 6,
            example: 'NewSecurePass123!',
            description: 'New password',
          },
        },
        required: ['current_password', 'new_password'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Password changed successfully',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Password changed successfully' },
          data: {
            type: 'object',
            properties: {
              user_id: { type: 'number', example: 1 },
              updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid current password',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Invalid current password' },
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
      description: 'Update user profile information (requires authentication)',
    }),
    ApiAuthBearer(),
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
  );

export const ApiLogout = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User logout',
      description: 'Logout user and invalidate session (requires authentication)',
    }),
    ApiAuthBearer(),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Logout successful' },
          data: {
            type: 'object',
            properties: {
              user_id: { type: 'number', example: 1 },
              session_invalidated: { type: 'boolean', example: true },
              logged_out_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
            },
          },
          trxId: { type: 'string', example: 'TID123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
  );
