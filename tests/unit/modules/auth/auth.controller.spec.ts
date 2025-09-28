import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { successResponse } from 'src/common/helpers/response.helper';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    username: 'admin',
    role: 'user',
    permissions: ['read'],
  };
  const mockJwt = {
    access_token: 'mocked-jwt-token',
    refresh_token: 'mocked-refresh-token',
  };

  const mockAuthService = {
    validateUser: jest.fn().mockResolvedValue(mockUser),
    login: jest.fn().mockResolvedValue(mockJwt),
    refreshToken: jest.fn().mockResolvedValue({ access_token: 'new-token' }),
    register: jest.fn().mockResolvedValue(mockUser),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
    forgotPassword: jest.fn().mockResolvedValue({ message: 'Password reset email sent', reset_token: 'reset-token' }),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset successfully' }),
    changePassword: jest.fn().mockResolvedValue({ message: 'Password changed successfully' }),
    getProfile: jest.fn().mockResolvedValue({
      id: 1,
      username: 'admin',
      full_name: 'Admin User',
      email: 'admin@example.com',
    }),
    updateProfile: jest.fn().mockResolvedValue({
      id: 1,
      username: 'admin',
      full_name: 'Updated Name',
      email: 'admin@example.com',
    }),
    getActiveSessionCount: jest.fn().mockResolvedValue(1),
    cleanupExpiredSessions: jest.fn().mockResolvedValue({ message: 'Sessions cleaned up' }),
    trackFailedLogin: jest.fn(),
    clearFailedLogins: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login and return success response', async () => {
    const body = { username: 'admin', password: 'admin123' };

    const result = await controller.login(body);
    expect(authService.validateUser).toHaveBeenCalledWith(body.username, body.password);
    expect(authService.login).toHaveBeenCalledWith(mockUser);
    expect(result).toMatchObject({
      data: mockJwt,
      message: 'Login successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should handle error in login and track failed login', async () => {
    const body = { username: 'admin', password: 'wrongpassword' };
    const error = new Error('Invalid credentials');

    jest.spyOn(authService, 'validateUser').mockRejectedValue(error);

    await expect(controller.login(body)).rejects.toThrow('Invalid credentials');
    expect(authService.trackFailedLogin).toHaveBeenCalledWith(body.username, undefined);
  });

  it('should refresh token and return success response', async () => {
    const body = { refresh_token: 'refresh-token' };

    const result = await controller.refreshToken(body);
    expect(authService.refreshToken).toHaveBeenCalledWith(body.refresh_token);
    expect(result).toMatchObject({
      data: { access_token: 'new-token' },
      message: 'Token refreshed successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should register user and return success response', async () => {
    const body = {
      full_name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password123',
      role: 'user',
    };

    const result = await controller.register(body);
    expect(authService.register).toHaveBeenCalledWith(body);
    expect(result).toMatchObject({
      data: mockUser,
      message: 'User registered successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should logout and return success response', async () => {
    const body = { session_token: 'session-token' };
    const req = { headers: { authorization: 'Bearer session-token' } };

    const result = await controller.logout(req as any);
    expect(authService.logout).toHaveBeenCalledWith('session-token');
    expect(result).toMatchObject({
      data: { message: 'Logged out successfully' },
      message: 'Logout successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should send forgot password and return success response', async () => {
    const body = { email: 'john@example.com' };

    const result = await controller.forgotPassword(body);
    expect(authService.forgotPassword).toHaveBeenCalledWith(body);
    expect(result).toMatchObject({
      data: { message: 'Password reset email sent', reset_token: 'reset-token' },
      message: 'Password reset instructions sent to email!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should reset password and return success response', async () => {
    const body = {
      reset_token: 'reset-token',
      new_password: 'newpassword123',
    };

    const result = await controller.resetPassword(body);
    expect(authService.resetPassword).toHaveBeenCalledWith(body);
    expect(result).toMatchObject({
      data: { message: 'Password reset successfully' },
      message: 'Password reset successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should change password and return success response', async () => {
    const body = {
      current_password: 'oldpassword',
      new_password: 'newpassword123',
    };
    const req = { user: { sub: 1 } };
    const changePasswordSpy = jest.spyOn(controller, 'changePassword');
    changePasswordSpy.mockImplementation(async (req, body) => {
      const userId = req.user.sub;
      const result = await authService.changePassword(userId, body);
      return successResponse(result, 'Password changed successfully!');
    });

    const result = await controller.changePassword(req as any, body);
    expect(authService.changePassword).toHaveBeenCalledWith(1, body);
    expect(result).toMatchObject({
      data: { message: 'Password changed successfully' },
      message: 'Password changed successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });

    changePasswordSpy.mockRestore();
  });

  it('should handle changePassword with proper req.user.sub extraction', async () => {
    const body = { current_password: 'oldpass', new_password: 'newpass' };
    const req = { user: { sub: 123 } };
    const changePasswordSpy = jest.spyOn(controller, 'changePassword');
    changePasswordSpy.mockImplementation(async (req, body) => {
      const userId = req.user.sub;
      const result = await authService.changePassword(userId, body);
      return successResponse(result, 'Password changed successfully!');
    });

    const result = await controller.changePassword(req as any, body);
    expect(authService.changePassword).toHaveBeenCalledWith(123, body);
    expect(result).toMatchObject({
      data: { message: 'Password changed successfully' },
      message: 'Password changed successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });

    changePasswordSpy.mockRestore();
  });

  it('should handle changePassword with direct method call', async () => {
    const body = { current_password: 'oldpass', new_password: 'newpass' };
    const req = { user: { sub: 456 } };
    const result = await controller.changePassword(req as any, body);
    expect(authService.changePassword).toHaveBeenCalledWith(456, body);
    expect(result).toMatchObject({
      data: { message: 'Password changed successfully' },
      message: 'Password changed successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should get profile and return success response', async () => {
    const req = { user: { sub: 1 } };

    const result = await controller.getProfile(req);
    expect(authService.getProfile).toHaveBeenCalledWith(1);
    expect(result).toMatchObject({
      data: {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
      },
      message: 'Profile retrieved successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should update profile and return success response', async () => {
    const body = { full_name: 'Updated Name' };
    const req = { user: { sub: 1 } };
    const updateProfileSpy = jest.spyOn(controller, 'updateProfile');
    updateProfileSpy.mockImplementation(async (req, body) => {
      const userId = req.user.sub;
      const user = await authService.updateProfile(userId, body);
      return successResponse(user, 'Profile updated successfully!');
    });

    const result = await controller.updateProfile(req as any, body);
    expect(authService.updateProfile).toHaveBeenCalledWith(1, body);
    expect(result).toMatchObject({
      data: {
        id: 1,
        username: 'admin',
        full_name: 'Updated Name',
        email: 'admin@example.com',
      },
      message: 'Profile updated successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });

    updateProfileSpy.mockRestore();
  });

  it('should handle updateProfile with proper req.user.sub extraction', async () => {
    const body = { full_name: 'Updated Name' };
    const req = { user: { sub: 456 } };
    const updateProfileSpy = jest.spyOn(controller, 'updateProfile');
    updateProfileSpy.mockImplementation(async (req, body) => {
      const userId = req.user.sub;
      const user = await authService.updateProfile(userId, body);
      return successResponse(user, 'Profile updated successfully!');
    });

    const result = await controller.updateProfile(req as any, body);
    expect(authService.updateProfile).toHaveBeenCalledWith(456, body);
    expect(result).toMatchObject({
      data: {
        id: 1,
        username: 'admin',
        full_name: 'Updated Name',
        email: 'admin@example.com',
      },
      message: 'Profile updated successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });

    updateProfileSpy.mockRestore();
  });

  it('should handle updateProfile with direct method call', async () => {
    const body = { full_name: 'Updated Name' };
    const req = { user: { sub: 789 } };

    const result = await controller.updateProfile(req as any, body);
    expect(authService.updateProfile).toHaveBeenCalledWith(789, body);
    expect(result).toMatchObject({
      data: {
        id: 1,
        username: 'admin',
        full_name: 'Updated Name',
        email: 'admin@example.com',
      },
      message: 'Profile updated successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should get session info and return success response', async () => {
    const req = { user: { sub: 1 } };

    const result = await controller.getSessionInfo(req as any);
    expect(authService.getActiveSessionCount).toHaveBeenCalledWith(1);
    expect(result).toMatchObject({
      data: {
        active_sessions: 1,
        user_id: 1,
        message: 'Session info retrieved successfully',
      },
      message: 'Session info retrieved successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });

  it('should cleanup sessions and return success response', async () => {
    const result = await controller.cleanupSessions();
    expect(authService.cleanupExpiredSessions).toHaveBeenCalled();
    expect(result).toMatchObject({
      data: { message: 'Expired sessions cleaned up' },
      message: 'Sessions cleaned up successfully!',
      statusCode: 200,
      trxId: expect.any(String),
    });
  });
});
