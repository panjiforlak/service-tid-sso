import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  successResponse,
  throwError,
} from '../../common/helpers/response.helper';

jest.mock('../../common/helpers/response.helper', () => ({
  successResponse: (data: any) => ({ success: true, data }),
  throwError: (message: string, status: number) => {
    throw new Error(`${status} - ${message}`);
  },
}));

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = { id: 1, username: 'admin' };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findById: jest.fn((id: number) =>
      id === 1 ? Promise.resolve(mockUser) : Promise.resolve(null),
    ),
    create: jest.fn((body) => Promise.resolve({ id: 2, ...body })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all users', async () => {
    const result = await controller.findAll();
    expect(result).toEqual({ success: true, data: [mockUser] });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return one user', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual({ success: true, data: mockUser });
    expect(service.findById).toHaveBeenCalledWith(1);
  });

  it('should throw error if user not found', async () => {
    await expect(controller.findOne(999)).rejects.toThrow(
      '404 - User not found',
    );
  });

  it('should create a user', async () => {
    const body = { username: 'test' };
    const result = await controller.create(body);
    expect(result).toEqual({
      success: true,
      data: { id: 2, username: 'test' },
    });
    expect(service.create).toHaveBeenCalledWith(body);
  });

  it('should delete a user', async () => {
    const result = await controller.delete(1);
    expect(result).toEqual({ message: 'User deleted successfully' });
    expect(service.delete).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException if user not found', async () => {
    mockUsersService.delete.mockResolvedValueOnce({ affected: 0 });

    await expect(controller.delete(999)).rejects.toThrow('User not found');
  });
});
