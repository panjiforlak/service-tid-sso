import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSession } from 'src/modules/users/entities/user-session.entity';
import { PasswordReset } from 'src/modules/users/entities/password-reset.entity';
import { FailedLogin } from 'src/modules/users/entities/failed-login.entity';
import * as bcrypt from 'bcrypt';
import {
  createMockAuthService,
  createMockUsersService,
  createMockJwtService,
  createMockUserSessionRepository,
  createMockPasswordResetRepository,
  createMockFailedLoginRepository,
  mockUser,
} from 'tests/__mocks__/auth.mock';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: ReturnType<typeof createMockUsersService>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let userSessionRepo: ReturnType<typeof createMockUserSessionRepository>;
  let passwordResetRepo: ReturnType<typeof createMockPasswordResetRepository>;
  let failedLoginRepo: ReturnType<typeof createMockFailedLoginRepository>;

  beforeEach(async () => {
    usersService = createMockUsersService();
    jwtService = createMockJwtService();
    userSessionRepo = createMockUserSessionRepository();
    passwordResetRepo = createMockPasswordResetRepository();
    failedLoginRepo = createMockFailedLoginRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(UserSession), useValue: userSessionRepo },
        { provide: getRepositoryToken(PasswordReset), useValue: passwordResetRepo },
        { provide: getRepositoryToken(FailedLogin), useValue: failedLoginRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // usersService = module.get<UsersService>(UsersService);
    // jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if valid', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin', 'admin123');
      expect(result).toEqual({
        id: 1,
        username: 'admin',
        role: 'user',
        permissions: ['read'],
      });
    });

    it('should throw error if user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      await expect(service.validateUser('admin', 'wrong')).rejects.toThrow();
    });

    it('should throw error if password invalid', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('admin', 'wrong')).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return access_token and refresh_token when no existing session', async () => {
      jwtService.signAsync.mockResolvedValue('signed-token');
      userSessionRepo.findOne.mockResolvedValue(null);
      userSessionRepo.create.mockReturnValue({});
      userSessionRepo.save.mockResolvedValue({});

      const result = await service.login(mockUser);
      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
    });

    it('should return access_token and refresh_token when existing session', async () => {
      const existingSession = { id: 1, user_id: 1 };
      jwtService.signAsync.mockResolvedValue('signed-token');
      userSessionRepo.findOne.mockResolvedValue(existingSession);
      userSessionRepo.update.mockResolvedValue({});

      const result = await service.login(mockUser);
      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new access token', async () => {
      const decoded = { username: 'admin', sub: 1, role: 'user', permissions: ['read'] };
      const mockSession = { id: 1, refresh_token: 'refresh-token', is_active: true };
      userSessionRepo.findOne.mockResolvedValue(mockSession);
      jwtService.verifyAsync.mockResolvedValue(decoded);
      jwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refreshToken('refresh-token');
      expect(result).toEqual({ access_token: 'new-token' });
      expect(userSessionRepo.findOne).toHaveBeenCalledWith({
        where: {
          refresh_token: 'refresh-token',
          is_active: true,
        },
      });
    });

    it('should throw error when session not found', async () => {
      userSessionRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow();
    });

    it('should throw error for invalid refresh token', async () => {
      const mockSession = { id: 1, refresh_token: 'refresh-token', is_active: true };
      userSessionRepo.findOne.mockResolvedValue(mockSession);
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken('invalid-token')).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const registerDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: 'user',
      };

      usersService.findByUsername.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue({
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'hashed-password',
        role: 'user',
        is_active: true,
        email_verified: false,
      });

      const result = await service.register(registerDto);
      expect(result).toEqual({
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        role: 'user',
        is_active: true,
        email_verified: false,
      });
    });

    it('should throw error if username already exists', async () => {
      const registerDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
      };

      usersService.findByUsername.mockResolvedValue({ id: 1, username: 'johndoe' });

      await expect(service.register(registerDto)).rejects.toThrow();
    });

    it('should throw error if email already exists', async () => {
      const registerDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
      };

      usersService.findByUsername.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue({ id: 1, email: 'john@example.com' });

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      userSessionRepo.update.mockResolvedValue({});

      const result = await service.logout('session-token');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset token', async () => {
      const forgotPasswordDto = { email: 'john@example.com' };
      const mockUser = { id: 1, email: 'john@example.com' };

      usersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRepo.create.mockReturnValue({});
      passwordResetRepo.save.mockResolvedValue({});

      const result = await service.forgotPassword(forgotPasswordDto);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('reset_token');
    });

    it('should throw error if email not found', async () => {
      const forgotPasswordDto = { email: 'notfound@example.com' };
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword(forgotPasswordDto)).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto = {
        reset_token: 'valid-token',
        new_password: 'newpassword123',
      };
      const mockPasswordReset = {
        id: 1,
        user_id: 1,
        reset_token: 'valid-token',
        expires_at: new Date(Date.now() + 3600000),
        is_used: false,
        user: { id: 1 },
      };

      passwordResetRepo.findOne.mockResolvedValue(mockPasswordReset);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.updatePassword.mockResolvedValue(undefined);
      passwordResetRepo.update.mockResolvedValue({});

      const result = await service.resetPassword(resetPasswordDto);
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should throw error for invalid reset token', async () => {
      const resetPasswordDto = {
        reset_token: 'invalid-token',
        new_password: 'newpassword123',
      };

      passwordResetRepo.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto = {
        current_password: 'oldpassword',
        new_password: 'newpassword123',
      };
      const mockUser = { id: 1, password: 'hashed-old-password' };

      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      usersService.updatePassword.mockResolvedValue(undefined);

      const result = await service.changePassword(1, changePasswordDto);
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw error if current password is incorrect', async () => {
      const changePasswordDto = {
        current_password: 'wrongpassword',
        new_password: 'newpassword123',
      };
      const mockUser = { id: 1, password: 'hashed-old-password' };

      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, changePasswordDto)).rejects.toThrow();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed-password',
      };

      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);
      expect(result).toEqual({
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
      });
    });

    it('should return user profile with timezone conversion', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed-password',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(1, 'Asia/Jakarta');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should return user profile with timezone when created_at is null', async () => {
      const mockUserWithUpdated = {
        ...mockUser,
        created_at: null,
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };
      usersService.findById.mockResolvedValue(mockUserWithUpdated);

      const result = await service.getProfile(1, 'Asia/Jakarta');
      expect(result.created_at).toBeUndefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should return user profile with timezone when updated_at is null', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed-password',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: null,
      };

      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(1, 'Asia/Jakarta');
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeUndefined();
    });

    it('should throw error if user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateProfileDto = { full_name: 'Updated Name' };

      usersService.updateProfile.mockResolvedValue(mockUser);

      const result = await service.updateProfile(1, updateProfileDto);
      expect(result).toEqual({
        id: 1,
        username: 'admin',
        role: 'user',
        permissions: ['read'],
      });
    });
  });

  describe('trackFailedLogin', () => {
    it('should track failed login attempt', async () => {
      failedLoginRepo.findOne.mockResolvedValue(null);
      failedLoginRepo.save.mockResolvedValue({});

      await service.trackFailedLogin('admin', '192.168.1.1');
      expect(failedLoginRepo.save).toHaveBeenCalled();
    });

    it('should increment failed login count', async () => {
      const existingFailedLogin = {
        id: 1,
        username: 'admin',
        attempt_count: 3,
        is_locked: false,
      };

      failedLoginRepo.findOne.mockResolvedValue(existingFailedLogin);
      failedLoginRepo.update.mockResolvedValue({});

      await service.trackFailedLogin('admin', '192.168.1.1');
      expect(failedLoginRepo.update).toHaveBeenCalled();
    });

    it('should lock account after 5 failed attempts', async () => {
      const existingFailedLogin = {
        id: 1,
        username: 'admin',
        attempt_count: 4,
        is_locked: false,
      };

      failedLoginRepo.findOne.mockResolvedValue(existingFailedLogin);
      failedLoginRepo.update.mockResolvedValue({});

      await expect(service.trackFailedLogin('admin', '192.168.1.1')).rejects.toThrow();
    });
  });

  describe('clearFailedLogins', () => {
    it('should clear failed login attempts', async () => {
      failedLoginRepo.delete.mockResolvedValue({});

      await service.clearFailedLogins('admin');
      expect(failedLoginRepo.delete).toHaveBeenCalledWith({ username: 'admin' });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      userSessionRepo.update.mockResolvedValue({});

      await service.cleanupExpiredSessions();
      expect(userSessionRepo.update).toHaveBeenCalled();
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return active session count', async () => {
      userSessionRepo.count.mockResolvedValue(1);

      const result = await service.getActiveSessionCount(1);
      expect(result).toBe(1);
    });

    it('should return 0 on error', async () => {
      userSessionRepo.count.mockRejectedValue(new Error('Database error'));

      const result = await service.getActiveSessionCount(1);
      expect(result).toBe(0);
    });
  });

  describe('login error handling', () => {
    it('should handle error in login method', async () => {
      const userPayload = {
        id: 1,
        username: 'testuser',
        role: 'user',
        permissions: [],
      };
      // Mock the jwtService.signAsync to throw an error
      jwtService.signAsync.mockRejectedValue(new Error('JWT error'));

      await expect(service.login(userPayload)).rejects.toThrow('JWT error');
    });
  });

  describe('logout error handling', () => {
    it('should handle error in logout method', async () => {
      const sessionToken = 'valid-session-token';
      userSessionRepo.update.mockRejectedValue(new Error('Database error'));

      await expect(service.logout(sessionToken)).rejects.toThrow('Something went wrong while logging out');
    });
  });

  describe('cleanupExpiredSessions error handling', () => {
    it('should handle error in cleanupExpiredSessions method', async () => {
      userSessionRepo.update.mockRejectedValue(new Error('Database error'));

      // Should not throw error, just silently handle it
      await expect(service.cleanupExpiredSessions()).resolves.toBeUndefined();
    });
  });

  describe('resetPassword error handling', () => {
    it('should handle expired reset token', async () => {
      const resetDto = { reset_token: 'expired-token', new_password: 'newpassword123' };
      const expiredReset = {
        id: 1,
        user: { id: 1 },
        expires_at: new Date(Date.now() - 1000), // Expired
        is_used: false,
      };

      passwordResetRepo.findOne.mockResolvedValue(expiredReset);

      await expect(service.resetPassword(resetDto)).rejects.toThrow('Reset token has expired');
    });

    it('should handle user not found in resetPassword', async () => {
      const resetDto = { reset_token: 'valid-token', new_password: 'newpassword123' };
      const validReset = {
        id: 1,
        user: { id: 999 }, // No-exist user
        expires_at: new Date(Date.now() + 1000),
        is_used: false,
      };

      passwordResetRepo.findOne.mockResolvedValue(validReset);
      usersService.updatePassword.mockRejectedValue(new Error('User not found'));

      await expect(service.resetPassword(resetDto)).rejects.toThrow('User not found');
    });
  });

  describe('changePassword error handling', () => {
    it('should handle user not found in changePassword', async () => {
      const changePasswordDto = { current_password: 'oldpass', new_password: 'newpass' };
      usersService.findById.mockResolvedValue(null);

      await expect(service.changePassword(1, changePasswordDto)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile error handling', () => {
    it('should handle error in updateProfile method', async () => {
      const updateProfileDto = { full_name: 'New Name' };
      usersService.updateProfile.mockRejectedValue(new Error('Database error'));

      await expect(service.updateProfile(1, updateProfileDto)).rejects.toThrow('Database error');
    });
  });

  describe('trackFailedLogin error handling', () => {
    it('should handle error in trackFailedLogin method', async () => {
      failedLoginRepo.findOne.mockRejectedValue(new Error('Database error'));
      await expect(service.trackFailedLogin('testuser', '192.168.1.1')).resolves.toBeUndefined();
    });
  });

  describe('clearFailedLogins error handling', () => {
    it('should handle error in clearFailedLogins method', async () => {
      failedLoginRepo.delete.mockRejectedValue(new Error('Database error'));
      await expect(service.clearFailedLogins('testuser')).resolves.toBeUndefined();
    });
  });

  describe('validateUser error handling with null error message', () => {
    it('should handle error in validateUser with null error message', async () => {
      usersService.findByUsername.mockRejectedValue(new Error());

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(
        'Something went wrong while validating user',
      );
    });
  });

  describe('login error handling with null error message', () => {
    it('should handle error in login with null error message', async () => {
      jwtService.signAsync.mockRejectedValue(new Error());

      await expect(service.login({ id: 1, username: 'test', role: 'user', permissions: [] })).rejects.toThrow(
        'Something went wrong while generating token',
      );
    });
  });

  describe('register error handling with null error message', () => {
    it('should handle error in register with null error message', async () => {
      usersService.findByEmail.mockRejectedValue(new Error());

      await expect(
        service.register({ username: 'test', email: 'test@test.com', password: 'password', full_name: 'Test User' }),
      ).rejects.toThrow('Something went wrong while registering user');
    });
  });

  describe('forgotPassword error handling with null error message', () => {
    it('should handle error in forgotPassword with null error message', async () => {
      usersService.findByEmail.mockRejectedValue(new Error());

      await expect(service.forgotPassword({ email: 'test@test.com' })).rejects.toThrow(
        'Something went wrong while processing forgot password',
      );
    });
  });

  describe('resetPassword error handling with null error message', () => {
    it('should handle error in resetPassword with null error message', async () => {
      passwordResetRepo.findOne.mockRejectedValue(new Error());

      await expect(service.resetPassword({ reset_token: 'token', new_password: 'password' })).rejects.toThrow(
        'Something went wrong while resetting password',
      );
    });
  });

  describe('changePassword error handling with null error message', () => {
    it('should handle error in changePassword with null error message', async () => {
      const mockUser = { id: 1, password: 'hashed-old-password' };
      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.updatePassword.mockRejectedValue(new Error());

      await expect(service.changePassword(1, { current_password: 'old', new_password: 'new' })).rejects.toThrow(
        'Something went wrong while changing password',
      );
    });
  });

  describe('getProfile error handling with null error message', () => {
    it('should handle error in getProfile with null error message', async () => {
      usersService.findById.mockRejectedValue(new Error());

      await expect(service.getProfile(1)).rejects.toThrow('Something went wrong while getting profile');
    });
  });

  describe('updateProfile error handling with null error message', () => {
    it('should handle error in updateProfile with null error message', async () => {
      usersService.updateProfile.mockRejectedValue(new Error());

      await expect(service.updateProfile(1, { full_name: 'New Name' })).rejects.toThrow(
        'Something went wrong while updating profile',
      );
    });
  });
});
