import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RabbitmqModule } from '../../integrations/rabbitmq/rabbitmq.module';
import { S3Module } from '../../integrations/s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RabbitmqModule, S3Module], // sample import RMQ & S3
  providers: [UsersService, RabbitmqModule],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
