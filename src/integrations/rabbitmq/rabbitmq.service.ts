import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  async emit(pattern: string, data: any) {
    return this.client.emit(pattern, data).toPromise();
  }

  async send(pattern: string, data: any) {
    return this.client.send(pattern, data).toPromise();
  }
}
