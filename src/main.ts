import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter, RateLimiter } from './common/exceptions/all-exception.exception';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateTrxId } from './common/helpers/common.helper';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/sso');

  const config = new DocumentBuilder()
    .setTitle('Your API')
    .setDescription('API documentation')
    .setVersion('1.0')
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const isStrictValidation = configService.get<string>('STRICT_VALIDATION') === 'true';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: isStrictValidation,
      forbidNonWhitelisted: isStrictValidation,
      transform: true,
      exceptionFactory: (errors) => {
        const trxId = generateTrxId();

        // Ambil pesan validation dari class-validator
        const validationMessages = errors.map((err) => Object.values(err.constraints || {}).join(', '));

        return new BadRequestException({
          statusCode: 400,
          message: 'Please check your account or password!',
          data: {
            error: true,
            validation: validationMessages,
          },
          trxId,
        });
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(), new RateLimiter());
  app.useGlobalInterceptors(new LoggerInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
