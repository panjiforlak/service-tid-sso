import { User } from 'src/modules/users/entities/user.entity';

// mock data
export const mockUser: User = {
  id: 1,
  username: 'admin',
  full_name: 'Admin User',
  email: 'admin@example.com',
  password: 'hashed-password',
  role: 'user',
  permissions: ['read'],
  is_active: true,
  email_verified: true,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-02T00:00:00Z'),
  sessions: [],
  password_resets: [],
  user_roles: [],
};

// function
export const createMockUsersService = () => ({
  findAll: jest.fn().mockResolvedValue([mockUser]),
  findById: jest.fn((id: number) => (id === 1 ? Promise.resolve(mockUser) : Promise.resolve(null))),
  findByUsername: jest.fn((username: string) =>
    username === mockUser.username ? Promise.resolve(mockUser) : Promise.resolve(null),
  ),
  findByEmail: jest.fn((email: string) =>
    email === mockUser.email ? Promise.resolve(mockUser) : Promise.resolve(null),
  ),
  create: jest.fn((body) => Promise.resolve({ id: 2, ...body })),
  updateProfile: jest.fn((id, body) => Promise.resolve({ ...mockUser, ...body })),
  updatePassword: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});
