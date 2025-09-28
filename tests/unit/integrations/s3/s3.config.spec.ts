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
    const { s3Config } = require('src/integrations/s3/s3.config');
    expect(s3Config).toBeDefined();
  });

  it('should use environment variables when they are set (truthy branch)', () => {
    // Set environment variables
    process.env.AWS_REGION = 'us-west-2';
    process.env.AWS_BUCKET = 'my-test-bucket';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

    // Re-import the module to get fresh config
    const { s3Config: freshConfig } = require('src/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('us-west-2');
    expect(freshConfig.bucket).toBe('my-test-bucket');
    expect(freshConfig.accessKeyId).toBe('test-access-key');
    expect(freshConfig.secretAccessKey).toBe('test-secret-key');
  });

  it('should use empty string as default when environment variables are not set (falsy branch)', () => {
    // Delete environment variables to make them undefined
    delete process.env.AWS_REGION;
    delete process.env.AWS_BUCKET;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    // Re-import the module to get fresh config
    const { s3Config: freshConfig } = require('src/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('');
    expect(freshConfig.bucket).toBe('');
    expect(freshConfig.accessKeyId).toBe('');
    expect(freshConfig.secretAccessKey).toBe('');
  });

  it('should use empty string as default when environment variables are empty string (falsy branch)', () => {
    // Set environment variables to empty string
    process.env.AWS_REGION = '';
    process.env.AWS_BUCKET = '';
    process.env.AWS_ACCESS_KEY_ID = '';
    process.env.AWS_SECRET_ACCESS_KEY = '';

    // Re-import the module to get fresh config
    const { s3Config: freshConfig } = require('src/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('');
    expect(freshConfig.bucket).toBe('');
    expect(freshConfig.accessKeyId).toBe('');
    expect(freshConfig.secretAccessKey).toBe('');
  });

  it('should handle mixed environment variables (some truthy, some falsy)', () => {
    // Set some environment variables to truthy values and others to falsy
    process.env.AWS_REGION = 'eu-west-1';
    process.env.AWS_BUCKET = 'mixed-bucket';
    delete process.env.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = '';

    // Re-import the module to get fresh config
    const { s3Config: freshConfig } = require('src/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('eu-west-1');
    expect(freshConfig.bucket).toBe('mixed-bucket');
    expect(freshConfig.accessKeyId).toBe('');
    expect(freshConfig.secretAccessKey).toBe('');
  });

  it('should use environment variables when they are truthy strings', () => {
    // Set environment variables to truthy strings
    process.env.AWS_REGION = '0';
    process.env.AWS_BUCKET = 'false';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

    // Re-import the module to get fresh config
    const { s3Config: freshConfig } = require('src/integrations/s3/s3.config');

    expect(freshConfig.region).toBe('0');
    expect(freshConfig.bucket).toBe('false');
    expect(freshConfig.accessKeyId).toBe('test-key');
    expect(freshConfig.secretAccessKey).toBe('test-secret');
  });

  it('should load dotenv when NODE_ENV is not test', () => {
    // Set NODE_ENV to something other than 'test'
    process.env.NODE_ENV = 'development';
    
    // Mock dotenv.config to verify it's called
    const mockDotenvConfig = jest.fn();
    jest.doMock('dotenv', () => ({
      config: mockDotenvConfig,
    }));

    // Re-import the module to get fresh config
    const { s3Config: freshConfig } = require('src/integrations/s3/s3.config');

    expect(freshConfig).toBeDefined();
    expect(mockDotenvConfig).toHaveBeenCalled();
  });
});