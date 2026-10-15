import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import { LlmUsageRecorder } from './usage/llm-usage.recorder';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: LlmUsageRecorder, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
