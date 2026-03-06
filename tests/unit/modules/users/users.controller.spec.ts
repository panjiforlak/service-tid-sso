import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, NotFoundException } from '@nestjs/common';
import { UsersController, UploadController } from 'src/modules/users/users.controller';
import { UsersService } from 'src/modules/users/users.service';
import { S3Service } from 'src/integrations/s3/s3.service';
import { createMockUsersService } from 'tests/__mocks__/user.mock';
import { DeleteResult } from 'typeorm';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser = { id: 1, username: 'admin' };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findById: jest.fn((id: number) => (id === 1 ? Promise.resolve(mockUser) : Promise.resolve(null))),
    create: jest.fn((body) => Promise.resolve({ id: 2, ...body })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    updatePassword: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const mockUsersService = createMockUsersService();
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
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all users', async () => {
    const result = await controller.findAll();
    expect(result).toMatchObject({
      data: [mockUser],
      message: 'Retrieve data success',
      statusCode: 200,
      timestamp: expect.any(String),
    });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return one user', async () => {
    const result = await controller.findOne(1);
    expect(result).toMatchObject({
      data: mockUser,
      message: 'Retrieve data success',
      statusCode: 200,
      timestamp: expect.any(String),
    });
    expect(service.findById).toHaveBeenCalledWith(1);
  });

  it('should throw error if user not found', async () => {
    await expect(controller.findOne(999)).rejects.toThrow(HttpException);
    await expect(controller.findOne(999)).rejects.toThrow('User not found');
  });

  it('should create a user', async () => {
    const body = { username: 'test' };
    const result = await controller.create(body);
    expect(result).toMatchObject({
      data: { id: 2, username: 'test' },
      message: 'Retrieve data success',
      statusCode: 200,
      timestamp: expect.any(String),
    });
    expect(service.create).toHaveBeenCalledWith(body);
  });

  it('should delete a user', async () => {
    const result = await controller.delete(1);
    expect(result).toEqual({ message: 'User deleted successfully' });
    expect(service.delete).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException if user not found', async () => {
    const mockDeleteResult: DeleteResult = { raw: [], affected: 0 };
    service.delete.mockResolvedValueOnce(mockDeleteResult);

    await expect(controller.delete(999)).rejects.toThrow(NotFoundException);
    expect(service.delete).toHaveBeenCalledWith(999);
  });
});

describe('UploadController', () => {
  let uploadController: UploadController;
  let s3Service: S3Service;

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue('https://example.com/file.jpg'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    uploadController = module.get<UploadController>(UploadController);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(uploadController).toBeDefined();
  });

  it('should upload file and return URL', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const body = { folder: 'uploads' };

    const result = await uploadController.upload(mockFile, body);

    expect(s3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'uploads');
    expect(result).toEqual({ url: 'https://example.com/file.jpg' });
  });

  it('should handle upload with different folder', async () => {
    const mockFile = {
      originalname: 'document.pdf',
      buffer: Buffer.from('pdf content'),
    } as Express.Multer.File;

    const body = { folder: 'documents' };

    const result = await uploadController.upload(mockFile, body);

    expect(s3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'documents');
    expect(result).toEqual({ url: 'https://example.com/file.jpg' });
  });
});
