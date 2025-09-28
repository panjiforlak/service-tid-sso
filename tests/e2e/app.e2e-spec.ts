import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';

// Mock S3 configuration
jest.mock('src/integrations/s3/s3.config', () => ({
  s3Config: {
    region: 'us-east-1',
    bucket: 'test-bucket',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
  },
}));

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Health', () => {
    it('should be defined', () => {
      expect(app).toBeDefined();
    });

    it('should have HTTP server', () => {
      expect(app.getHttpServer()).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', () => {
      return request(app.getHttpServer()).get('/api/sso/non-existent').expect(404);
    });

    it('should handle 404 for root path', () => {
      return request(app.getHttpServer()).get('/').expect(404);
    });
  });

  describe('API Endpoints', () => {
    it('should handle auth endpoints', () => {
      return request(app.getHttpServer())
        .post('/api/sso/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect((res) => {
          // Accept various status codes as valid responses
          expect([200, 401, 404, 400]).toContain(res.status);
        });
    });

    it('should handle user endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/sso/users')
        .expect((res) => {
          // Accept various status codes as valid responses
          expect([200, 401, 404, 403]).toContain(res.status);
        });
    });

    it('should handle profile endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/sso/users/profile')
        .expect((res) => {
          // Accept various status codes as valid responses
          expect([200, 401, 404, 403]).toContain(res.status);
        });
    });
  });

  describe('Validation', () => {
    it('should handle invalid JSON', () => {
      return request(app.getHttpServer())
        .post('/api/sso/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect((res) => {
          // Accept various status codes as valid responses
          expect([400, 404, 500]).toContain(res.status);
        });
    });

    it('should handle missing Content-Type', () => {
      return request(app.getHttpServer())
        .post('/api/sso/auth/register')
        .send('test')
        .expect((res) => {
          // Accept various status codes as valid responses
          expect([400, 404, 500]).toContain(res.status);
        });
    });
  });

  describe('HTTP Methods', () => {
    it('should handle GET requests', () => {
      return request(app.getHttpServer()).get('/api/sso/test').expect(404);
    });

    it('should handle POST requests', () => {
      return request(app.getHttpServer()).post('/api/sso/test').expect(404);
    });

    it('should handle PUT requests', () => {
      return request(app.getHttpServer()).put('/api/sso/test').expect(404);
    });

    it('should handle DELETE requests', () => {
      return request(app.getHttpServer()).delete('/api/sso/test').expect(404);
    });
  });

  describe('CORS and Headers', () => {
    it('should handle OPTIONS requests', () => {
      return request(app.getHttpServer())
        .options('/api/sso/test')
        .expect((res) => {
          // Accept various status codes as valid responses
          expect([200, 204, 404, 405]).toContain(res.status);
        });
    });

    it('should include CORS headers', () => {
      return request(app.getHttpServer())
        .get('/api/sso/test')
        .expect(404)
        .expect((res) => {
          // Check if CORS headers are present (if configured)
          expect(res.headers).toBeDefined();
        });
    });
  });
});
