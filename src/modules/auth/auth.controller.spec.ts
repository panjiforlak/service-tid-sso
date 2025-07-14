import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { successResponse } from '../../common/helpers/response.helper';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = { id: 1, username: 'admin' };
  const mockJwt = { access_token: 'mocked-jwt-token' };

  const mockAuthService = {
    validateUser: jest.fn().mockResolvedValue(mockUser),
    login: jest.fn().mockReturnValue(mockJwt),
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
    expect(authService.validateUser).toHaveBeenCalledWith(
      body.username,
      body.password,
    );
    expect(authService.login).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(successResponse(mockJwt, 'Login succesfully!'));
  });
});
