import type { ModelResponse, ContentBlock, TokenUsage, ProviderConfig } from '../types.js';
import type { APIToolDefinition } from '../tools/tool.js';

export interface Provider {
  readonly model: string;
  chat(request: ChatRequest): Promise<ModelResponse>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: APIToolDefinition[];
  systemPrompt?: string;
  maxOutputTokens?: number;
  temperature?: number;
  abortSignal?: AbortSignal;
}

export interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string | ContentBlock[];
  tool_use_id?: string;
  is_error?: boolean;
}

export type { APIToolDefinition } from '../tools/tool.js';

export class RetryableError extends Error {
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'RetryableError';
    this.cause = cause;
  }
}

export abstract class BaseProvider implements Provider {
  readonly model: string;
  readonly maxOutputTokens?: number;
  readonly temperature?: number;

  constructor(config: ProviderConfig) {
    this.model = config.model;
    this.maxOutputTokens = config.maxOutputTokens;
    this.temperature = config.temperature;
  }

  abstract chat(request: ChatRequest): Promise<ModelResponse>;

  protected abstract mapMessages(messages: ChatMessage[]): unknown[];

  protected abstract mapTools(tools?: APIToolDefinition[]): unknown[] | undefined;

  protected abstract mapUsage(providerUsage: unknown): TokenUsage;

  protected mapStopReason(reason: string): ModelResponse["stopReason"] {
    switch (reason) {
      case 'end_turn':
      case 'stop':
        return 'end_turn';
      case 'tool_use':
      case 'tool_calls':
        return 'tool_use';
      case 'max_tokens':
      case 'length':
        return 'max_tokens';
      case 'stop_sequence':
        return 'stop_sequence';
      default:
        return 'end_turn';
    }
  }
}
