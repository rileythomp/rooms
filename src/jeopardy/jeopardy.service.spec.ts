import { Test, TestingModule } from '@nestjs/testing';
import { JeopardyService } from './jeopardy.service';

describe('JeopardyService', () => {
  let service: JeopardyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JeopardyService],
    }).compile();

    service = module.get<JeopardyService>(JeopardyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
