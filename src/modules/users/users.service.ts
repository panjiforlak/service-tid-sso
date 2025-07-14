import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RabbitmqService } from '../../integrations/rabbitmq/rabbitmq.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  async findAll() {
    return this.userRepository.find();
  }

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    const savedUser = await this.userRepository.save(user);

    await this.rabbitmqService.emit('user.created', { id: savedUser.id });
    return savedUser;
  }

  async delete(id: number) {
    return this.userRepository.delete(id);
  }
}
