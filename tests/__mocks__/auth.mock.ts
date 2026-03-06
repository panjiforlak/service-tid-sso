// mock data
export const mockUser = {
  id: 1,
  username: 'admin',
  role: 'user',
  permissions: ['read'],
};

export const mockJwt = {
  access_token: 'mocked-jwt-token',
  refresh_token: 'mocked-refresh-token',
};

export const mockProfile = {
  id: 1,
  username: 'admin',
  full_name: 'Admin User',
  email: 'admin@example.com',
};

// function
export const createMockAuthService = () => ({
  validateUser: jest.fn().mockResolvedValue(mockUser),
  login: jest.fn().mockResolvedValue(mockJwt),
  refreshToken: jest.fn().mockResolvedValue({ access_token: 'new-token' }),
  register: jest.fn().mockResolvedValue(mockUser),
  logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
  forgotPassword: jest.fn().mockResolvedValue({
    message: 'Password reset email sent',
    reset_token: 'reset-token',
  }),
  resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset successfully' }),
  changePassword: jest.fn().mockResolvedValue({ message: 'Password changed successfully' }),
  getProfile: jest.fn().mockResolvedValue(mockProfile),
  updateProfile: jest.fn().mockResolvedValue({
    ...mockProfile,
    full_name: 'Updated Name',
  }),
  getActiveSessionCount: jest.fn().mockResolvedValue(1),
  cleanupExpiredSessions: jest.fn().mockResolvedValue({ message: 'Expired sessions cleaned up' }),
  trackFailedLogin: jest.fn(),
  clearFailedLogins: jest.fn(),
});

export const createMockUsersService = () => ({
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updatePassword: jest.fn(),
  updateProfile: jest.fn(),
});

export const createMockJwtService = () => ({
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
});

export const createMockUserSessionRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
});

export const createMockPasswordResetRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

export const createMockFailedLoginRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});
