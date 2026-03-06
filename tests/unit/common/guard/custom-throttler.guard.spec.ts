import { CustomThrottlerGuard } from 'src/common/guard/custom-throttler.guard';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;
  let configService: ConfigService;
  let mockThrottlerStorage: ThrottlerStorage;
  let reflector: Reflector;

  const mockThrottlerStorageInstance = {
    getRecord: jest.fn(),
    addRecord: jest.fn(),
  } as any;

  const mockOptions = {
    ttl: 60000,
    limit: 100,
  };

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    reflector = new Reflector();
    mockThrottlerStorage = mockThrottlerStorageInstance;

    guard = new CustomThrottlerGuard(mockOptions, mockThrottlerStorage, reflector, configService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;

    beforeEach(() => {
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({
            headers: {},
            ip: '127.0.0.1',
          }),
          getResponse: () => ({}),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;
    });

    it('should return true when RATE_LIMIT_ENABLED is not "true"', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('false');

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('RATE_LIMIT_ENABLED');
    });

    it('should return true when RATE_LIMIT_ENABLED is undefined', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when RATE_LIMIT_ENABLED is null', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should call super.canActivate when RATE_LIMIT_ENABLED is "true"', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('true');
      
      // Create a spy on the parent class method
      const parentPrototype = Object.getPrototypeOf(CustomThrottlerGuard.prototype);
      const originalCanActivate = parentPrototype.canActivate;
      const parentCanActivateSpy = jest.spyOn(parentPrototype, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(configService.get).toHaveBeenCalledWith('RATE_LIMIT_ENABLED');
      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);

      parentCanActivateSpy.mockRestore();
      parentPrototype.canActivate = originalCanActivate;
    });

    it('should call super.canActivate and return false when throttled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('true');
      
      // Create a spy on the parent class method
      const parentPrototype = Object.getPrototypeOf(CustomThrottlerGuard.prototype);
      const originalCanActivate = parentPrototype.canActivate;
      const parentCanActivateSpy = jest.spyOn(parentPrototype, 'canActivate').mockResolvedValue(false);

      const result = await guard.canActivate(mockExecutionContext);

      expect(configService.get).toHaveBeenCalledWith('RATE_LIMIT_ENABLED');
      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(false);

      parentCanActivateSpy.mockRestore();
      parentPrototype.canActivate = originalCanActivate;
    });
  });
});
