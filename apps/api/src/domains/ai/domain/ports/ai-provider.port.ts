/**
 * AI Provider Port Interface
 *
 * Domain-level abstraction for external AI services (OpenAI, Anthropic, etc.)
 * Implementations reside in Infrastructure layer
 */

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export enum AIModelType {
  ECONOMY = 'economy',
  DEFAULT = 'default',
  PREMIUM = 'premium',
}

export interface AIGenerateRequest {
  model: AIModelType;
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  reasoning?: 'none' | 'low' | 'medium';
  verbosity?: 'low' | 'medium' | 'high';
}

export interface AIGenerateResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelId: string;
}

// ──────────────────────────────────────────────
// Port Token (for DI)
// ──────────────────────────────────────────────

export const AI_PROVIDER_PORT = Symbol('AI_PROVIDER_PORT');

// ──────────────────────────────────────────────
// Port Interface
// ──────────────────────────────────────────────

/**
 * AI Provider Port
 *
 * Defines the contract for external AI service providers.
 * Infrastructure layer implements this interface for OpenAI, Anthropic, etc.
 *
 * Design:
 * - Converts domain model (AIGenerateRequest) to provider-specific format
 * - Returns domain model (AIGenerateResponse) back to caller
 * - Handles token counting, error mapping, and rate limiting
 */
export abstract class AIProviderPort {
  /**
   * Generate text using external AI service
   * @param request Domain model request
   * @returns Domain model response with token usage
   */
  abstract generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;

  /**
   * Check if provider is available (has valid credentials, etc.)
   * @returns true if provider is operational
   */
  abstract isAvailable(): Promise<boolean>;
}
