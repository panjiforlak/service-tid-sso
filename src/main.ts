import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { TrxIdInterceptor } from './common/shared/http/interceptors/trx-id.interceptor';
import { GlobalExceptionFilter } from './common/shared/http/interceptors/global-exception.filter';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, {
//     logger: ['log', 'error'], // hilangkan warn noise
//   });

//   const configService = app.get(ConfigService);

//   app.setGlobalPrefix('api/sso');

//   /* SWAGGER */
//   const swaggerConfig = new DocumentBuilder()
//     .setTitle('SSO Phase')
//     .setDescription('API documentation')
//     .setVersion('1.0.0')
//     .addBearerAuth(
//       {
//         type: 'http',
//         scheme: 'bearer',
//         bearerFormat: 'JWT',
//       },
//       'jwt',
//     )
//     .build();

//   const document = SwaggerModule.createDocument(app, swaggerConfig);
//   SwaggerModule.setup('docs', app, document);

//   /* VALIDATION */
//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//   /* INTERCEPTOR */
//   app.useGlobalInterceptors(new TrxIdInterceptor());

//   await app.listen(configService.get<number>('PORT') || 3000);

//   console.log(`Server running on port ${configService.get<number>('PORT')}`);
// }

// void bootstrap();

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error'],
  });

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TrxIdInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(configService.get<number>('PORT') || 3000);

  console.log(`Server running on port ${configService.get<number>('PORT')}`);
}

if (require.main === module) {
  void bootstrap();
}
