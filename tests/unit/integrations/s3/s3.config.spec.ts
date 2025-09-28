import { s3Config } from '@/integrations/s3/s3.config';
describe('s3Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear the module cache to ensure fresh import
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(s3Config).toBeDefined();
  });

  it('should use environment variables when they are set (truthy branch)', async () => {
    // Set environment
    process.env.AWS_REGION = 'us-west-2';
    process.env.AWS_BUCKET = 'my-test-bucket';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

    const { s3Config: freshConfig } = await import('@/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('us-west-2');
    expect(freshConfig.bucket).toBe('my-test-bucket');
    expect(freshConfig.accessKeyId).toBe('test-access-key');
    expect(freshConfig.secretAccessKey).toBe('test-secret-key');
  });

  it('should use empty string as default when environment variables are not set (falsy branch)', async () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_BUCKET;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    const { s3Config: freshConfig } = await import('@/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('');
    expect(freshConfig.bucket).toBe('');
    expect(freshConfig.accessKeyId).toBe('');
    expect(freshConfig.secretAccessKey).toBe('');
  });

  it('should use empty string as default when environment variables are empty string (falsy branch)', async () => {
    process.env.AWS_REGION = '';
    process.env.AWS_BUCKET = '';
    process.env.AWS_ACCESS_KEY_ID = '';
    process.env.AWS_SECRET_ACCESS_KEY = '';

    const { s3Config: freshConfig } = await import('@/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('');
    expect(freshConfig.bucket).toBe('');
    expect(freshConfig.accessKeyId).toBe('');
    expect(freshConfig.secretAccessKey).toBe('');
  });

  it('should handle mixed environment variables (some truthy, some falsy)', async () => {
    process.env.AWS_REGION = 'eu-west-1';
    process.env.AWS_BUCKET = 'mixed-bucket';
    delete process.env.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = '';

    const { s3Config: freshConfig } = await import('@/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('eu-west-1');
    expect(freshConfig.bucket).toBe('mixed-bucket');
    expect(freshConfig.accessKeyId).toBe('');
    expect(freshConfig.secretAccessKey).toBe('');
  });

  it('should use environment variables when they are truthy strings', async () => {
    process.env.AWS_REGION = '0';
    process.env.AWS_BUCKET = 'false';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

    const { s3Config: freshConfig } = await import('@/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('0');
    expect(freshConfig.bucket).toBe('false');
    expect(freshConfig.accessKeyId).toBe('test-key');
    expect(freshConfig.secretAccessKey).toBe('test-secret');
  });

  it('should load dotenv when NODE_ENV is not test', async () => {
    process.env.NODE_ENV = 'development';

    const mockDotenvConfig = jest.fn();
    jest.doMock('dotenv', () => ({
      config: mockDotenvConfig,
    }));

    const { s3Config: freshConfig } = await import('@/integrations/s3/s3.config');

    expect(freshConfig).toBeDefined();
    expect(mockDotenvConfig).toHaveBeenCalled();
  });
});
