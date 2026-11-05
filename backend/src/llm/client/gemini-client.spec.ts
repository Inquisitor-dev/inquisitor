import type { GeminiClient as Client } from './gemini-client';

const CHAIN = ['model-a', 'model-b', 'model-c'];
const request = { messages: [{ role: 'user', content: 'x' }], temperature: 0 };
const apiError = (status: number) =>
  Object.assign(new Error(`${status} upstream secret`), { status });
const okReply = { model: 'ok', choices: [] };

describe('GeminiClient — API kredisi bitince (402)', () => {
  let mod: typeof import('./gemini-client');

  beforeAll(() => {
    // Zincir modül yüklenirken okunur; testler ortamdaki .env'e bağlı kalmasın
    process.env.GEMINI_MODELS = CHAIN.join(',');
    mod = jest.requireActual('./gemini-client');
  });

  // Her model için sırayla verilecek sonuçlar: Error fırlatılır, diğeri döndürülür
  const clientWith = (outcomes: Record<string, unknown>) => {
    const create = jest.fn(({ model }: { model: string }) => {
      const outcome = outcomes[model];
      return outcome instanceof Error
        ? Promise.reject(outcome)
        : Promise.resolve(outcome);
    });
    const client: Client = new mod.GeminiClient();
    Object.assign(client, { openai: { chat: { completions: { create } } } });
    const calledModels = () => create.mock.calls.map(([arg]) => arg.model);
    return { client, calledModels };
  };

  it('402 aynı modelde tekrar denenmez, sıradaki modele geçilir', async () => {
    const { client, calledModels } = clientWith({
      'model-a': apiError(402),
      'model-b': okReply,
    });
    await expect(client.createCompletion(request, 't', 1000)).resolves.toBe(
      okReply,
    );
    expect(calledModels()).toEqual(['model-a', 'model-b']);
  });

  it('bütün zincir 402 dönerse oyuncuya Türkçe 503 gider, ayrıntı sızmaz', async () => {
    const { client, calledModels } = clientWith({
      'model-a': apiError(402),
      'model-b': apiError(402),
      'model-c': apiError(402),
    });
    const error = await client
      .createCompletion(request, 't', 1000)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(mod.LlmCreditError);
    const httpError = error as InstanceType<typeof mod.LlmCreditError>;
    expect(httpError.getStatus()).toBe(503);
    expect(JSON.stringify(httpError.getResponse())).toContain(
      'Hakkın harcanmadı',
    );
    expect(JSON.stringify(httpError.getResponse())).not.toContain('upstream');
    expect(calledModels()).toEqual(CHAIN);
  });

  it('402 sonrası başka hatayla biten zincirde de sebep kredi sayılır', async () => {
    const { client } = clientWith({
      'model-a': apiError(402),
      'model-b': apiError(404),
      'model-c': apiError(400),
    });
    await expect(
      client.createCompletion(request, 't', 1000),
    ).rejects.toBeInstanceOf(mod.LlmCreditError);
  });

  it('402 yoksa özgün hata değişmeden fırlatılır', async () => {
    const original = apiError(400);
    const { client, calledModels } = clientWith({ 'model-a': original });
    await expect(client.createCompletion(request, 't', 1000)).rejects.toBe(
      original,
    );
    expect(calledModels()).toEqual(['model-a']);
  });
});
