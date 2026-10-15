import { LlmUsageRecorder } from './llm-usage.recorder';
import { PrismaService } from '../../prisma/prisma.service';

describe('LlmUsageRecorder', () => {
  const setup = (create = jest.fn().mockResolvedValue({})) => {
    const prisma = { llmUsage: { create } } as unknown as PrismaService;
    return { recorder: new LlmUsageRecorder(prisma), create };
  };

  it('çağrının token kullanımını vakayla birlikte kaydeder', async () => {
    const { recorder, create } = setup();
    await recorder.record(
      { kind: 'NPC_REPLY', sessionId: 's1' },
      'gemini-flash',
      { prompt_tokens: 2500, completion_tokens: 120, total_tokens: 2620 },
      840,
    );
    expect(create).toHaveBeenCalledWith({
      data: {
        sessionId: 's1',
        kind: 'NPC_REPLY',
        model: 'gemini-flash',
        promptTokens: 2500,
        completionTokens: 120,
        totalTokens: 2620,
        durationMs: 840,
      },
    });
  });

  it('kullanım bilgisi gelmezse sıfır yazar', async () => {
    const { recorder, create } = setup();
    await recorder.record({ kind: 'SCENARIO' }, 'm', undefined, 10);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: null,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }) as unknown,
    });
  });

  it('veritabanı hatası oyunu bozmaz', async () => {
    const { recorder } = setup(
      jest.fn().mockRejectedValue(new Error('db down')),
    );
    await expect(
      recorder.record({ kind: 'BOARD_THOUGHT' }, 'm', undefined, 5),
    ).resolves.toBeUndefined();
  });
});
