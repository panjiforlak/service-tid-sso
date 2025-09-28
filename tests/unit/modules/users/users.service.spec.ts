/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/modules/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { RabbitmqService } from 'src/integrations/rabbitmq/rabbitmq.service';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;
  let rabbit: RabbitmqService;

  const mockUser = { id: 1, username: 'admin' };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 1 || where.username === 'admin' || where.email === 'admin@example.com') {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((data: any) => data),
    save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 2, ...data })),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
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
    expect(rabbit.emit).toHaveBeenCalledWith('user.created', { id: 2, trxId: expect.any(String) });
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

  it('should find by email', async () => {
    const user = await service.findByEmail('admin@example.com');
    expect(user).toEqual(mockUser);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'admin@example.com' } });
  });

  it('should return null if user not found by email', async () => {
    const user = await service.findByEmail('notfound@example.com');
    expect(user).toBeNull();
  });

  it('should update password', async () => {
    const hashedPassword = 'hashed-password';
    mockRepo.update.mockResolvedValue({ affected: 1 });

    await service.updatePassword(1, hashedPassword);
    expect(repo.update).toHaveBeenCalledWith(1, { password: hashedPassword });
  });

  it('should update profile', async () => {
    const updateData = { full_name: 'Updated Name' };
    const updatedUser = { id: 1, username: 'admin', ...updateData };

    mockRepo.update.mockResolvedValue({ affected: 1 });
    mockRepo.findOne.mockResolvedValueOnce(updatedUser);

    const result = await service.updateProfile(1, updateData);
    expect(repo.update).toHaveBeenCalledWith(1, updateData);
    expect(result).toEqual(updatedUser);
  });

  it('should throw error if user not found during profile update', async () => {
    const updateData = { full_name: 'Updated Name' };

    mockRepo.update.mockResolvedValue({ affected: 1 });
    mockRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.updateProfile(1, updateData)).rejects.toThrow();
  });

  // Error handling tests
  it('should handle error in findByUsername', async () => {
    mockRepo.findOne.mockRejectedValue(new Error('Database error'));

    await expect(service.findByUsername('admin')).rejects.toThrow('Database error');
  });

  it('should handle error in findAll', async () => {
    mockRepo.find.mockRejectedValue(new Error('Database error'));

    await expect(service.findAll()).rejects.toThrow('Database error');
  });

  it('should handle error in findById', async () => {
    mockRepo.findOne.mockRejectedValue(new Error('Database error'));

    await expect(service.findById(1)).rejects.toThrow('Database error');
  });

  it('should handle error in create', async () => {
    mockRepo.create.mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(service.create({ username: 'test' })).rejects.toThrow('Database error');
  });

  it('should handle error in delete', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Database error'));

    await expect(service.delete(1)).rejects.toThrow('Database error');
  });

  it('should handle error in findByEmail', async () => {
    mockRepo.findOne.mockRejectedValue(new Error('Database error'));

    await expect(service.findByEmail('test@example.com')).rejects.toThrow('Database error');
  });

  it('should handle error in updatePassword', async () => {
    mockRepo.update.mockRejectedValue(new Error('Database error'));

    await expect(service.updatePassword(1, 'hashedpassword')).rejects.toThrow('Database error');
  });

  it('should handle error in updateProfile', async () => {
    mockRepo.update.mockRejectedValue(new Error('Database error'));

    await expect(service.updateProfile(1, { full_name: 'Test' })).rejects.toThrow('Database error');
  });

  it('should handle error in findByUsername with null error message', async () => {
    mockRepo.findOne.mockRejectedValue(new Error());

    await expect(service.findByUsername('admin')).rejects.toThrow('Failed to fetch user by username');
  });

  it('should handle error in findAll with null error message', async () => {
    mockRepo.find.mockRejectedValue(new Error());

    await expect(service.findAll()).rejects.toThrow('Failed to fetch users');
  });

  it('should handle error in findById with null error message', async () => {
    mockRepo.findOne.mockRejectedValue(new Error());

    await expect(service.findById(1)).rejects.toThrow('Failed to fetch user by id');
  });

  it('should handle error in create with null error message', async () => {
    mockRepo.create.mockImplementation(() => {
      throw new Error();
    });

    await expect(service.create({ username: 'test' })).rejects.toThrow('Failed to create user');
  });

  it('should handle error in delete with null error message', async () => {
    mockRepo.delete.mockRejectedValue(new Error());

    await expect(service.delete(1)).rejects.toThrow('Failed to delete user');
  });

  it('should handle error in findByEmail with null error message', async () => {
    mockRepo.findOne.mockRejectedValue(new Error());

    await expect(service.findByEmail('test@example.com')).rejects.toThrow('Failed to fetch user by email');
  });

  it('should handle error in updatePassword with null error message', async () => {
    mockRepo.update.mockRejectedValue(new Error());

    await expect(service.updatePassword(1, 'hashedpassword')).rejects.toThrow('Failed to update password');
  });

  it('should handle error in updateProfile with null error message', async () => {
    mockRepo.update.mockRejectedValue(new Error());

    await expect(service.updateProfile(1, { full_name: 'Test' })).rejects.toThrow('Failed to update profile');
  });
});
