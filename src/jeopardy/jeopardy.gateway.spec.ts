import { Test, TestingModule } from '@nestjs/testing';
import { JeopardyGateway } from './jeopardy.gateway';

describe('JeopardyGateway', () => {
  let gateway: JeopardyGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JeopardyGateway],
    }).compile();

    gateway = module.get<JeopardyGateway>(JeopardyGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
