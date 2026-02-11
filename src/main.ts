import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { generateTrxId } from './common/shared/helpers/common.helpers';
import { ThrottlerExceptionFilter } from './common/shared/http/filters/throttler-exception.filter';
import { AllExceptionsFilter } from './common/shared/http/filters/all-exception.filter';
import { TrxIdInterceptor } from './common/shared/http/interceptors/trx-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  /* SWAGGER */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SSO Phase')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
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
    }),
  );

  /* INTERCEPTOR */
  app.useGlobalInterceptors(new TrxIdInterceptor());

  await app.listen(configService.get<number>('PORT') || 3000);
}

bootstrap();
