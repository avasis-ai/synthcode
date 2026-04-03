import type { ModelResponse } from '../types.js';
import { BaseProvider, RetryableError } from './provider.js';
import type { Provider, ChatRequest, ChatMessage, APIToolDefinition } from './provider.js';
import { AnthropicProvider } from './anthropic.js';
import type { AnthropicProviderConfig } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import type { OpenAIProviderConfig } from './openai.js';
import { OllamaProvider } from './ollama.js';
import type { OllamaProviderConfig } from './ollama.js';

export { BaseProvider, RetryableError } from './provider.js';
export type { Provider, ChatRequest, ChatMessage, APIToolDefinition } from './provider.js';
export { AnthropicProvider } from './anthropic.js';
export type { AnthropicProviderConfig } from './anthropic.js';
export { OpenAIProvider } from './openai.js';
export type { OpenAIProviderConfig } from './openai.js';
export { OllamaProvider } from './ollama.js';
export type { OllamaProviderConfig } from './ollama.js';

export function anthropic(config: AnthropicProviderConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}

export function openai(config: OpenAIProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}

export function ollama(config: OllamaProviderConfig): OllamaProvider {
  return new OllamaProvider(config);
}

export interface CustomProviderConfig {
  provider: 'custom';
  model: string;
  chat: (request: ChatRequest) => Promise<ModelResponse>;
}

class CustomProvider implements Provider {
  readonly model: string;
  private readonly chatFn: (request: ChatRequest) => Promise<ModelResponse>;

  constructor(config: CustomProviderConfig) {
    this.model = config.model;
    this.chatFn = config.chat;
  }

  chat(request: ChatRequest): Promise<ModelResponse> {
    return this.chatFn(request);
  }
}

export type OllamaProviderConfigWithProvider = OllamaProviderConfig & { provider: 'ollama' };

export function createProvider(
  config:
    | (AnthropicProviderConfig & { provider: 'anthropic' })
    | (OpenAIProviderConfig & { provider: 'openai' })
    | OllamaProviderConfigWithProvider
    | CustomProviderConfig,
): Provider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    case 'custom':
      return new CustomProvider(config);
  }
}
