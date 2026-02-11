import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { generateTrxId } from './common/shared/helpers/common.helpers';
import { RateLimiter } from './common/shared/http/filters/rate-limiter.filter';
import { AllExceptionsFilter } from './common/shared/http/filters/all-exception.filter';
import { TrxIdInterceptor } from './common/shared/http/interceptors/trx-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, //pino
  });

  const configService = app.get(ConfigService);

  /* GLOBAL CONFIG */
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new RateLimiter(), new AllExceptionsFilter());

  /* SWAGGER SETUP */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SSO Phase')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  /* VALIDATION PIPE */
  const isStrictValidation = configService.get<string>('STRICT_VALIDATION') === 'true';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: isStrictValidation,
      forbidNonWhitelisted: isStrictValidation,
      transform: true,
      exceptionFactory: (errors) => {
        const trxId = generateTrxId();

        const validationMessages = errors.map((err) => Object.values(err.constraints || {}).join(', '));

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          data: {
            error: true,
            validation: validationMessages,
          },
          trxId,
        });
      },
    }),
  );
  /* GLOBAL INTERCEPTORS */
  app.useGlobalInterceptors(new TrxIdInterceptor());

  /* LISTENER */
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  // console.log(`🚀 API running on http://localhost:${port}`);
  // console.log(`📚 Swagger docs on http://localhost:${port}/docs`);
}

bootstrap();
