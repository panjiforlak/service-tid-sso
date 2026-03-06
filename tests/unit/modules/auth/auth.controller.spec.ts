import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { createMockAuthService, mockJwt, mockUser } from 'tests/__mocks__/auth.mock';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockService = createMockAuthService();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login and return success response', async () => {
    const body = { username: 'admin', password: 'admin123' };
    const req = { headers: { 'x-tz': 'Asia/Jakarta' } } as any;
    const ipAddress = '192.168.1.1';

    const result = await controller.login(body, req, ipAddress);
    expect(authService.validateUser).toHaveBeenCalledWith(body.username, body.password);
    expect(authService.login).toHaveBeenCalledWith(mockUser);
    expect(authService.clearFailedLogins).toHaveBeenCalledWith(body.username);
    expect(result).toMatchObject({
      data: mockJwt,
      message: 'Login successfully!',
      statusCode: 200,
      timestamp: expect.any(String),
      timezone: {
        offsetZone: 'ASIA/JAKARTA',
        timeLocal: expect.any(String),
      },
    });
  });

  it('should handle error in login and track failed login', async () => {
    const body = { username: 'admin', password: 'wrongpassword' };
    const req = { headers: {} } as any;
    const ipAddress = '192.168.1.1';
    const error = new Error('Invalid credentials');

    jest.spyOn(authService, 'validateUser').mockRejectedValue(error);

    await expect(controller.login(body, req, ipAddress)).rejects.toThrow('Invalid credentials');
    expect(authService.trackFailedLogin).toHaveBeenCalledWith(body.username, ipAddress);
  });

  it('should refresh token and return success response', async () => {
    const body = { refresh_token: 'refresh-token' };

    const result = await controller.refreshToken(body);
    expect(authService.refreshToken).toHaveBeenCalledWith(body.refresh_token);
    expect(result).toMatchObject({
      data: { access_token: 'new-token' },
      message: 'Token refreshed successfully!',
      statusCode: 200,
      timestamp: expect.any(String),
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
      timestamp: expect.any(String),
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
      timestamp: expect.any(String),
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
      timestamp: expect.any(String),
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
      timestamp: expect.any(String),
    });
  });

  it('should change password and return success response', async () => {
    const body = {
      current_password: 'oldpassword',
      new_password: 'newpassword123',
    };
    const req = { user: { sub: 1 } };

    const result = await controller.changePassword(req as any, body);
    expect(authService.changePassword).toHaveBeenCalledWith(1, body);
    expect(result).toMatchObject({
      data: { message: 'Password changed successfully' },
      message: 'Password changed successfully!',
      statusCode: 200,
      timestamp: expect.any(String),
    });
  });

  it('should get profile and return success response', async () => {
    const req = { user: { sub: 1 } } as any;
    const tz = 'Asia/Jakarta';

    const result = await controller.getProfile(req, tz);
    expect(authService.getProfile).toHaveBeenCalledWith(1, tz);
    expect(result).toMatchObject({
      data: {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
      },
      message: 'Profile retrieved successfully!',
      statusCode: 200,
      timestamp: expect.any(String),
      timezone: {
        offsetZone: 'ASIA/JAKARTA',
        timeLocal: expect.any(String),
      },
    });
  });

  it('should get profile without timezone and return success response', async () => {
    const req = { user: { sub: 1 } } as any;

    const result = await controller.getProfile(req);
    expect(authService.getProfile).toHaveBeenCalledWith(1, undefined);
    expect(result).toMatchObject({
      data: {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
      },
      message: 'Profile retrieved successfully!',
      statusCode: 200,
      timestamp: expect.any(String),
    });
  });

  it('should update profile and return success response', async () => {
    const body = { full_name: 'Updated Name' };
    const req = { user: { sub: 1 } };

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
      timestamp: expect.any(String),
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
      timestamp: expect.any(String),
    });
  });

  it('should cleanup sessions and return success response', async () => {
    const result = await controller.cleanupSessions();
    expect(authService.cleanupExpiredSessions).toHaveBeenCalled();
    expect(result).toMatchObject({
      data: { message: 'Expired sessions cleaned up' },
      message: 'Sessions cleaned up successfully!',
      statusCode: 200,
      timestamp: expect.any(String),
    });
  });
});
