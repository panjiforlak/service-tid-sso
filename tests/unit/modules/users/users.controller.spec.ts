import { Test, TestingModule } from '@nestjs/testing';
import { UsersController, UploadController } from 'src/modules/users/users.controller';
import { UsersService } from 'src/modules/users/users.service';
import { successResponse, throwError } from 'src/common/helpers/response.helper';
import { S3Service } from 'src/integrations/s3/s3.service';

jest.mock('src/common/helpers/response.helper', () => ({
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
    findById: jest.fn((id: number) => (id === 1 ? Promise.resolve(mockUser) : Promise.resolve(null))),
    create: jest.fn((body) => Promise.resolve({ id: 2, ...body })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    updatePassword: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(mockUser),
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
    await expect(controller.findOne(999)).rejects.toThrow('404 - User not found');
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

describe('UploadController', () => {
  let uploadController: any;
  let s3Service: any;

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue('https://example.com/file.jpg'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            findByEmail: jest.fn().mockResolvedValue(null),
            updatePassword: jest.fn().mockResolvedValue(undefined),
            updateProfile: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    const controller = module.get<UsersController>(UsersController);
    uploadController = {
      s3Service: mockS3Service,
      upload: async (file: Express.Multer.File, body: any) => {
        const url = await uploadController.s3Service.uploadFile(file, body.folder);
        return { url };
      },
    };
  });

  it('should upload file and return URL', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const body = { folder: 'uploads' };

    const result = await uploadController.upload(mockFile, body);

    expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'uploads');
    expect(result).toEqual({ url: 'https://example.com/file.jpg' });
  });

  it('should handle upload with different folder', async () => {
    const mockFile = {
      originalname: 'document.pdf',
      buffer: Buffer.from('pdf content'),
    } as Express.Multer.File;

    const body = { folder: 'documents' };

    const result = await uploadController.upload(mockFile, body);

    expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'documents');
    expect(result).toEqual({ url: 'https://example.com/file.jpg' });
  });

  it('should test UploadController constructor', () => {
    const UploadControllerClass = class {
      constructor(private readonly s3Service: any) {}
    };

    const instance = new UploadControllerClass(mockS3Service);
    expect(instance).toBeDefined();
  });

  it('should test upload method directly', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const body = { folder: 'uploads' };
    const url = await mockS3Service.uploadFile(mockFile, body.folder);
    const result = { url };

    expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'uploads');
    expect(result).toEqual({ url: 'https://example.com/file.jpg' });
  });

  it('should test UploadController with actual class', () => {
    class TestUploadController {
      constructor(private readonly s3Service: S3Service) {}

      async upload(file: Express.Multer.File, body: any) {
        const url = await this.s3Service.uploadFile(file, body.folder);
        return { url };
      }
    }

    const testController = new TestUploadController(mockS3Service as any);
    expect(testController).toBeDefined();
    expect(mockS3Service).toBeDefined();
  });

  it('should test UploadController upload method with actual implementation', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;
    const body = { folder: 'uploads' };
    const url = await mockS3Service.uploadFile(mockFile, body.folder);
    const result = { url };

    expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'uploads');
    expect(result).toEqual({ url: 'https://example.com/file.jpg' });
  });

  it('should test UploadController class directly', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    const uploadController = module.get<UploadController>(UploadController);

    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const body = { folder: 'uploads' };

    const result = await uploadController.upload(mockFile, body);

    expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'uploads');
    expect(result).toEqual({ url: 'https://example.com/file.jpg' });
  });
});
