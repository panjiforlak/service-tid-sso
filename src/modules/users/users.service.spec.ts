/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RabbitmqService } from '../../integrations/rabbitmq/rabbitmq.service';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;
  let rabbit: RabbitmqService;

  const mockUser = { id: 1, username: 'admin' };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 1 || where.username === 'admin') {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((data: any) => data),
    save: jest
      .fn()
      .mockImplementation((data) => Promise.resolve({ id: 2, ...data })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockRabbit = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
        {
          provide: RabbitmqService,
          useValue: mockRabbit,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
    rabbit = module.get<RabbitmqService>(RabbitmqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all users', async () => {
    const users = await service.findAll();
    expect(users).toEqual([mockUser]);
    expect(repo.find).toHaveBeenCalled();
  });

  it('should find by id', async () => {
    const user = await service.findById(1);
    expect(user).toEqual(mockUser);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('should return null if user not found by id', async () => {
    const user = await service.findById(999);
    expect(user).toBeNull();
  });

  it('should find by username', async () => {
    const user = await service.findByUsername('admin');
    expect(user).toEqual(mockUser);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { username: 'admin' } });
  });

  it('should return null if user not found by username', async () => {
    const user = await service.findByUsername('notfound');
    expect(user).toBeNull();
  });

  it('should create user and emit event', async () => {
    const data = { username: 'test' };
    const result = await service.create(data);
    expect(repo.create).toHaveBeenCalledWith(data);
    expect(repo.save).toHaveBeenCalledWith(data);
    expect(rabbit.emit).toHaveBeenCalledWith('user.created', { id: 2 });
    expect(result).toEqual({ id: 2, username: 'test' });
  });

  it('should delete user', async () => {
    const result = await service.delete(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual({ affected: 1 });
  });

  it('should return { affected: 0 } if delete fails', async () => {
    mockRepo.delete.mockResolvedValueOnce({ affected: 0 });
    const result = await service.delete(999);
    expect(result).toEqual({ affected: 0 });
  });
});
