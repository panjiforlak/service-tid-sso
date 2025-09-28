import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from 'src/integrations/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

// Mock S3Client
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test file content'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.uploadFile(file);

      expect(typeof result).toBe('string');
      expect(result).toContain('https://');
    });

    it('should handle different file types', async () => {
      const pdfFile = {
        originalname: 'document.pdf',
        buffer: Buffer.from('pdf content'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const result = await service.uploadFile(pdfFile);

      expect(typeof result).toBe('string');
      expect(result).toContain('https://');
    });

    it('should handle file without extension', async () => {
      const fileWithoutExt = {
        originalname: 'testfile',
        buffer: Buffer.from('test content'),
        mimetype: 'text/plain',
      } as Express.Multer.File;

      const result = await service.uploadFile(fileWithoutExt);

      expect(typeof result).toBe('string');
      expect(result).toContain('https://');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const key = 'test-file-key.jpg';

      const result = await service.deleteFile(key);

      expect(result).toBeUndefined();
    });

    it('should handle different key formats', async () => {
      const key1 = 'folder/subfolder/file.jpg';
      const key2 = 'file-without-extension';

      const result1 = await service.deleteFile(key1);
      const result2 = await service.deleteFile(key2);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });
});
