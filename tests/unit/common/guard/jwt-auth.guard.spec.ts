import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should be an instance of AuthGuard', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });
});
