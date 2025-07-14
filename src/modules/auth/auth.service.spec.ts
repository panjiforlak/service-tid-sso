import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { throwError } from '../../common/helpers/response.helper';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if valid', async () => {
      const mockUser = { id: 1, username: 'admin', password: 'hashed' };
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = (await service.validateUser(
        'admin',
        'admin123',
      )) as string;
      expect(result).toEqual({ id: 1, username: 'admin' });
    });

    it('should throw error if user not found or password invalid', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      await expect(service.validateUser('admin', 'wrong')).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return access_token', () => {
      const mockUser = { id: 1, username: 'admin' };
      mockJwtService.sign.mockReturnValue('signed-token');

      const result = service.login(mockUser);
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
