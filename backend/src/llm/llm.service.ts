import { Injectable, Logger } from '@nestjs/common';
import { getScenarioConfig } from '../scenarios/scenario-config';
import { CasePlan } from '../scenarios/case-setup';
import type { ThoughtLine } from '../board/board';
import { CompletionRequest, GeminiClient } from './client/gemini-client';
import { LlmUsageContext, LlmUsageRecorder } from './usage/llm-usage.recorder';
import {
  buildNpcDialogueSystemPrompt,
  parseNpcReply,
} from './prompts/npc-prompt.builder';
import { buildBoardThoughtPrompt } from './prompts/board-prompt.builder';
import {
  type ScenarioDraft,
  buildCaseBrief,
  buildScenarioPrompt,
  buildReconciliationPrompt,
  parseScenarioDraft,
  mergeScenarioDraftWithFallback,
} from './prompts/scenario-prompt.builder';

export type { ScenarioDraft };

@Injectable()
export class LlmService {
  private readonly client = new GeminiClient();
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly usage: LlmUsageRecorder) {}

  // Her çağrının süresi ve token kullanımı ölçülüp kaydedilir (maliyet takibi)
  private async complete(
    params: CompletionRequest,
    label: string,
    timeoutMs: number,
    usage: LlmUsageContext,
  ) {
    const startedAt = Date.now();
    const response = await this.client.createCompletion(
      params,
      label,
      timeoutMs,
    );
    await this.usage.record(
      usage,
      response?.model ?? 'unknown',
      response?.usage,
      Date.now() - startedAt,
    );
    return response;
  }

  async generateNpcResponse(
    npcName: string,
    npcPrompt: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
    isNewDay: boolean = false,
    usage: LlmUsageContext = { kind: 'NPC_REPLY' },
  ): Promise<{ reply: string }> {
    try {
      const systemPrompt = buildNpcDialogueSystemPrompt(
        npcName,
        npcPrompt,
        isNewDay,
      );

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage },
      ];

      this.logger.log(
        `Calling Gemini API for NPC: ${npcName}, message: "${userMessage.slice(0, 50)}"`,
      );
      const response = await this.complete(
        { messages, temperature: 0.7 },
        `NPC ${npcName}`,
        30_000,
        usage,
      );

      const responseText = response?.choices?.[0]?.message?.content || '';
      this.logger.log(`Gemini raw response: ${responseText.slice(0, 200)}`);

      const reply = parseNpcReply(responseText, (msg) => this.logger.warn(msg));
      return { reply };
    } catch (error: any) {
      this.logger.error(`Gemini API Error: ${error?.message || error}`);
      this.logger.error(
        `Type: ${error?.constructor?.name}, Status: ${error?.status}, Code: ${error?.code}`,
      );

      let errorMessage =
        '*Karakter susuyor...* (Beklenmeyen bir hata oluştu, birazdan tekrar dene.)';
      if (error?.status === 429) {
        errorMessage =
          '*Karakter sessizliğe bürünüyor...* (Sunucu şu an çok yoğun, birazdan tekrar dene.)';
      }

      return { reply: errorMessage };
    }
  }

  async generateSessionScenario(
    difficulty: string = 'easy',
    scenarioType: string = 'medieval',
    plan: CasePlan,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const scenarioConfig = getScenarioConfig(scenarioType, difficulty);
    const {
      worldDescription,
      styleInstruction,
      npcDefinitions: baseNpcs,
      locationDefinitions,
    } = scenarioConfig;
    const { culpritId } = plan;
    const npcNames = Object.fromEntries(
      baseNpcs.map((npc) => [npc.id, npc.name]),
    );
    const caseBrief = buildCaseBrief(plan, scenarioType, npcNames);

    const prompt = buildScenarioPrompt({
      difficulty,
      scenarioType,
      worldDescription,
      styleInstruction,
      baseNpcs,
      locationDefinitions,
      plan,
      caseBrief,
    });

    this.logger.log(
      `Calling Gemini API to generate dynamic scenario (difficulty: ${difficulty}, scenario: ${scenarioType})...`,
    );

    const response = await this.complete(
      { messages: [{ role: 'user', content: prompt }], temperature: 0.9 },
      'Scenario',
      90_000,
      { kind: 'SCENARIO', sessionId },
    );

    const responseText = response?.choices?.[0]?.message?.content || '';

    try {
      const draft = parseScenarioDraft(responseText);
      return await this.reconcileScenarioConsistency(
        draft,
        scenarioType,
        locationDefinitions,
        culpritId,
        caseBrief,
        sessionId,
      );
    } catch {
      this.logger.error(`Failed to parse scenario JSON. Response: ${responseText}`);
      throw new Error('Failed to generate scenario JSON');
    }
  }

  private async reconcileScenarioConsistency(
    draft: ScenarioDraft,
    scenarioType: string,
    locationDefinitions: Array<{ id: string; description: string }>,
    culpritId: string,
    caseBrief: string,
    sessionId?: string,
  ): Promise<ScenarioDraft> {
    const reviewPrompt = buildReconciliationPrompt({
      draft,
      scenarioType,
      locationDefinitions,
      culpritId,
      caseBrief,
    });

    try {
      const response = await this.complete(
        { messages: [{ role: 'user', content: reviewPrompt }], temperature: 0.2 },
        'Scenario review',
        90_000,
        { kind: 'SCENARIO_REVIEW', sessionId },
      );

      const responseText = response?.choices?.[0]?.message?.content || '';
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        return draft;
      }

      const reviewed = JSON.parse(
        responseText.substring(firstBrace, lastBrace + 1),
      ) as ScenarioDraft;
      return mergeScenarioDraftWithFallback(
        draft,
        reviewed,
        locationDefinitions.map((location) => location.id),
      );
    } catch (error) {
      this.logger.warn(
        `Scenario continuity reconciliation failed, using draft as-is. ${error}`,
      );
      return draft;
    }
  }

  async generateBoardThought(
    lines: ThoughtLine[],
    scenarioType: string,
    sessionId?: string,
  ): Promise<string | null> {
    const prompt = buildBoardThoughtPrompt(lines, scenarioType);

    try {
      const response = await this.complete(
        { messages: [{ role: 'user', content: prompt }], temperature: 0.6 },
        'Board thought',
        30_000,
        { kind: 'BOARD_THOUGHT', sessionId },
      );
      const text = (response?.choices?.[0]?.message?.content || '').trim();
      return text || null;
    } catch (error) {
      this.logger.warn(
        `Board thought failed, falling back to template. ${error}`,
      );
      return null;
    }
  }
}
