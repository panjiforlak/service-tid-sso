import { Test, TestingModule } from '@nestjs/testing';
import { RabbitmqService } from 'src/integrations/rabbitmq/rabbitmq.service';

describe('RabbitmqService', () => {
  let service: RabbitmqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitmqService,
        {
          provide: 'RABBITMQ_SERVICE',
          useValue: {
            emit: jest.fn().mockReturnValue({
              toPromise: jest.fn().mockResolvedValue({}),
            }),
            send: jest.fn().mockReturnValue({
              toPromise: jest.fn().mockResolvedValue({}),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitmqService>(RabbitmqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emit', () => {
    it('should emit event successfully', async () => {
      const eventName = 'test.event';
      const data = { test: 'data' };

      const result = await service.emit(eventName, data);

      expect(result).toBeDefined();
    });

    it('should emit event with different data types', async () => {
      const eventName = 'test.event';
      const stringData = 'test string';
      const numberData = 123;
      const objectData = { key: 'value' };

      const result1 = await service.emit(eventName, stringData);
      const result2 = await service.emit(eventName, numberData);
      const result3 = await service.emit(eventName, objectData);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });

  describe('send', () => {
    it('should send message successfully', async () => {
      const pattern = 'test.pattern';
      const data = { test: 'data' };

      const result = await service.send(pattern, data);

      expect(result).toBeDefined();
    });

    it('should send message with different data types', async () => {
      const pattern = 'test.pattern';
      const stringData = 'test string';
      const numberData = 123;
      const objectData = { key: 'value' };

      const result1 = await service.send(pattern, stringData);
      const result2 = await service.send(pattern, numberData);
      const result3 = await service.send(pattern, objectData);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });
});
