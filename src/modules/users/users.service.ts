import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RabbitmqService } from '@/integrations/rabbitmq/rabbitmq.service';
import { throwError } from '@/common/helpers/response.helper';
import { generateTrxId } from '@/common/helpers/common.helper';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { username } });
    } catch (error) {
      throwError(error?.message || 'Failed to fetch user by username');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      throwError(error?.message || 'Failed to fetch users');
    }
  }

  async findById(id: number): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      throwError(error?.message || 'Failed to fetch user by id');
    }
  }

  async create(data: Partial<User>): Promise<User> {
    try {
      const trxId = generateTrxId('USR'); // trx untuk tracing
      const user = this.userRepository.create(data);
      const savedUser = await this.userRepository.save(user);

      await this.rabbitmqService.emit('user.created', { id: savedUser.id, trxId });
      return savedUser;
    } catch (error) {
      throwError(error?.message || 'Failed to create user');
    }
  }

  async delete(id: number) {
    try {
      const trxId = generateTrxId('USRDEL');
      const result = await this.userRepository.delete(id);

      await this.rabbitmqService.emit('user.deleted', { id, trxId });
      return result;
    } catch (error) {
      throwError(error?.message || 'Failed to delete user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      throwError(error?.message || 'Failed to fetch user by email');
    }
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    try {
      await this.userRepository.update(id, { password: hashedPassword });
    } catch (error) {
      throwError(error?.message || 'Failed to update password');
    }
  }

  async updateProfile(id: number, updateData: Partial<User>): Promise<User> {
    try {
      await this.userRepository.update(id, updateData);
      const user = await this.findById(id);
      if (!user) {
        throwError('User not found after update');
      }
      return user;
    } catch (error) {
      throwError(error?.message || 'Failed to update profile');
    }
  }
}
