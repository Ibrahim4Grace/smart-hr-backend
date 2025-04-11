import { Test, TestingModule } from '@nestjs/testing';
import { TerminationService } from './termination.service';

describe('TerminationService', () => {
  let service: TerminationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TerminationService],
    }).compile();

    service = module.get<TerminationService>(TerminationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
