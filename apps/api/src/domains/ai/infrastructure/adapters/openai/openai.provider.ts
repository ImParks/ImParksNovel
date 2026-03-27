import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProviderPort,
  AIGenerateRequest,
  AIGenerateResponse,
  AIModelType,
} from '../../../domain/ports/ai-provider.port';

// ──────────────────────────────────────────────
// OpenAI Client
// ──────────────────────────────────────────────

let OpenAI: any;
try {
  OpenAI = require('openai');
} catch (error) {
  // openai package not installed - will use mock
}

// ──────────────────────────────────────────────
// OpenAI Provider Implementation
// ──────────────────────────────────────────────

/**
 * OpenAI Provider Adapter
 *
 * Implements AIProviderPort for OpenAI's Responses API
 * - Maps domain model to OpenAI request format
 * - Extracts token usage from OpenAI response
 * - Returns mock response if API key not available
 * - Handles error mapping and rate limiting
 *
 * Architecture: Infrastructure Layer Adapter
 * - Domain Input: AIGenerateRequest (model, prompts, parameters)
 * - Domain Output: AIGenerateResponse (text, token counts, modelId)
 * - Uses Responses API (NOT chat.completions)
 */
@Injectable()
export class OpenAiProvider extends AIProviderPort {
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: any;
  private modelMap: Record<AIModelType, string>;
  private _isAvailable: boolean;

  constructor(private readonly configService: ConfigService) {
    super();
    this.initializeClient();
    this.initializeModelMap();
  }

  /**
   * Initialize OpenAI client
   * Falls back to mock mode if API key missing or package not installed
   */
  private initializeClient(): void {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        '[OpenAI] OPENAI_API_KEY not configured. Using mock responses.',
      );
      this._isAvailable = false;
      return;
    }

    try {
      if (!OpenAI) {
        this.logger.warn(
          '[OpenAI] openai package not installed. Using mock responses.',
        );
        this._isAvailable = false;
        return;
      }

      this.client = new OpenAI.default({ apiKey });
      this._isAvailable = true;
      this.logger.log('[OpenAI] Client initialized successfully');
    } catch (error) {
      this.logger.error('[OpenAI] Failed to initialize client', error);
      this._isAvailable = false;
    }
  }

  /**
   * Initialize model mapping from environment variables
   * Maps domain model types (economy, default, premium) to actual OpenAI model IDs
   */
  private initializeModelMap(): void {
    this.modelMap = {
      [AIModelType.ECONOMY]: this.configService.get<string>(
        'OPENAI_ECONOMY_MODEL',
        'gpt-4o-mini',
      ),
      [AIModelType.DEFAULT]: this.configService.get<string>(
        'OPENAI_DEFAULT_MODEL',
        'gpt-4o',
      ),
      [AIModelType.PREMIUM]: this.configService.get<string>(
        'OPENAI_PREMIUM_MODEL',
        'gpt-4-turbo',
      ),
    };

    this.logger.debug('[OpenAI] Model map initialized', this.modelMap);
  }

  /**
   * Get actual model ID from domain model type
   */
  private getModelId(model: AIModelType): string {
    return this.modelMap[model];
  }

  /**
   * Check if provider is available (has valid credentials)
   */
  async isAvailable(): Promise<boolean> {
    return this._isAvailable;
  }

  /**
   * Generate text using OpenAI Responses API
   * Falls back to mock response if provider not available
   */
  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // Use mock if provider unavailable
    if (!this._isAvailable) {
      return this.generateMockResponse(request);
    }

    try {
      const modelId = this.getModelId(request.model);

      this.logger.debug('[OpenAI] Generating with model', {
        modelId,
        userPromptLength: request.userPrompt.length,
      });

      // OpenAI Responses API call
      const response = await this.client.responses.create({
        model: modelId,
        instructions: request.systemPrompt, // developer role
        input: request.userPrompt, // user input
        reasoning: this.mapReasoningLevel(request.reasoning ?? 'none'),
        text: this.mapVerbosity(request.verbosity ?? 'medium'),
        max_completion_tokens: request.maxOutputTokens ?? 2048,
      });

      // Extract response data
      const text = response.output_text || '';
      const usage = response.usage || {};

      const result: AIGenerateResponse = {
        text,
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        modelId,
      };

      this.logger.debug('[OpenAI] Response generated', {
        totalTokens: result.totalTokens,
        textLength: text.length,
      });

      return result;
    } catch (error) {
      this.logger.error('[OpenAI] Generation failed', error);
      return this.generateMockResponse(request);
    }
  }

  /**
   * Generate mock response for development/fallback
   * Useful when API key not set or package not installed
   */
  private generateMockResponse(
    request: AIGenerateRequest,
  ): AIGenerateResponse {
    const mockText = `[Mock AI Response - ${request.model.toUpperCase()}]\n\nSystem: ${request.systemPrompt}\n\nUser: ${request.userPrompt}\n\nThis is a mock response. To enable real AI generation, set OPENAI_API_KEY environment variable and install openai package.`;

    // Rough token estimation: 1 token ≈ 4 characters
    const estimatedTokens = Math.ceil(
      (request.userPrompt.length + mockText.length) / 4,
    );

    return {
      text: mockText,
      inputTokens: Math.ceil(request.userPrompt.length / 4),
      outputTokens: Math.ceil(mockText.length / 4),
      totalTokens: estimatedTokens,
      modelId: this.getModelId(request.model),
    };
  }

  /**
   * Map domain reasoning level to OpenAI format
   */
  private mapReasoningLevel(
    reasoning: 'none' | 'low' | 'medium',
  ): { effort: string } {
    const effortMap = {
      none: 'none',
      low: 'low',
      medium: 'medium',
    };
    return { effort: effortMap[reasoning] };
  }

  /**
   * Map domain verbosity to OpenAI format
   */
  private mapVerbosity(verbosity: 'low' | 'medium' | 'high'): { verbosity: string } {
    const verbosityMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
    };
    return { verbosity: verbosityMap[verbosity] };
  }
}
