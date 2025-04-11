import { Test, TestingModule } from '@nestjs/testing';
import { TermConditionService } from './term-condition.service';

describe('TermConditionService', () => {
  let service: TermConditionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TermConditionService],
    }).compile();

    service = module.get<TermConditionService>(TermConditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
