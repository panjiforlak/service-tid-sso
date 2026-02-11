import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DynamicModule } from '@nestjs/common';

export function databaseConfig(): DynamicModule[] {
  const modules: DynamicModule[] = [];

  // MAIN DB
  modules.push(
    TypeOrmModule.forRootAsync({
      name: 'default',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        entities: [__dirname + '/../../modules/**/entities/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
  );

  // OPTIONAL AUDIT DB
  if (process.env.MULTIPLE_DB === 'yes') {
    modules.push(
      TypeOrmModule.forRootAsync({
        name: 'audit',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          type: 'postgres',
          host: config.get<string>('AUDIT_DB_HOST'),
          port: config.get<number>('AUDIT_DB_PORT', 5432),
          username: config.get<string>('AUDIT_DB_USER'),
          password: config.get<string>('AUDIT_DB_PASSWORD'),
          database: config.get<string>('AUDIT_DB_NAME'),
          entities: [__dirname + '/../audit/*.entity{.ts,.js}'],
          synchronize: false,
        }),
      }),
    );
  }

  return modules;
}
