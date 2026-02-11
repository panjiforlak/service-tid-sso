// src/common/guard/custom-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options,
    storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService, // ⬅️ PALING AKHIR
  ) {
    super(options, storage, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const enabled = this.configService.get<string>('RATE_LIMIT_ENABLED') === 'true';

    if (!enabled) {
      return true;
    }

    return super.canActivate(context);
  }
}
