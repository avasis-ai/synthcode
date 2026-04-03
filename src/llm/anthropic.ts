import type { ModelResponse, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock, TokenUsage, ProviderConfig } from '../types.js';
import type { ChatRequest, ChatMessage, APIToolDefinition } from './provider.js';
import { BaseProvider, RetryableError } from './provider.js';

export interface AnthropicProviderConfig extends ProviderConfig {
  apiKey: string;
  baseURL?: string;
  dangerouslySkipAuth?: boolean;
  enableCaching?: boolean;
}

export class AnthropicProvider extends BaseProvider {
  private readonly apiKey: string;
  private readonly baseURL?: string;
  private readonly dangerouslySkipAuth?: boolean;
  private readonly enableCaching: boolean;
  private client: any = null;

  constructor(config: AnthropicProviderConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.dangerouslySkipAuth = config.dangerouslySkipAuth;
    this.enableCaching = config.enableCaching ?? false;
  }

  async chat(request: ChatRequest): Promise<ModelResponse> {
    const AnthropicSDK = (await import('@anthropic-ai/sdk')).default;

    if (!this.client) {
      const opts: Record<string, unknown> = { apiKey: this.apiKey };
      if (this.baseURL) opts.baseURL = this.baseURL;
      if (this.dangerouslySkipAuth) opts.dangerouslySkipAuth = true;
      this.client = new AnthropicSDK(opts);
    }

    const messages = this.mapMessages(request.messages);
    const tools = this.mapTools(request.tools);
    const maxTokens = request.maxOutputTokens ?? this.maxOutputTokens ?? 4096;
    const temperature = request.temperature ?? this.temperature;

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: maxTokens,
      messages,
    };

    if (request.systemPrompt) {
      if (this.enableCaching) {
        body.system = [
          { type: "text", text: request.systemPrompt, cache_control: { type: "ephemeral" } },
        ];
      } else {
        body.system = request.systemPrompt;
      }
    }
    if (tools) body.tools = tools;
    if (temperature !== undefined) body.temperature = temperature;

    const reqOptions: Record<string, unknown> = {};
    if (request.abortSignal) reqOptions.signal = request.abortSignal;

    let response: any;
    try {
      response = await this.client.messages.create(body, reqOptions);
    } catch (err: unknown) {
      const status = (err as any)?.status;
      const code = (err as any)?.code;
      const isNetwork =
        err instanceof TypeError ||
        (typeof code === 'string' &&
          ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(code));

      if (status === 429 || status === 529 || isNetwork) {
        throw new RetryableError(
          err instanceof Error ? err.message : String(err),
          err instanceof Error ? err : undefined,
        );
      }
      throw new Error(
        `Anthropic API error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? { cause: err } : undefined,
      );
    }

    const content: ContentBlock[] = [];
    for (const block of response.content) {
      if (block.type === 'text') {
        content.push({ type: 'text', text: block.text } as TextBlock);
      } else if (block.type === 'tool_use') {
        content.push({ type: 'tool_use', id: block.id, name: block.name, input: block.input } as ToolUseBlock);
      } else if (block.type === 'thinking') {
        content.push({ type: 'thinking', thinking: block.thinking } as ThinkingBlock);
      }
    }

    return {
      content,
      usage: this.mapUsage(response.usage),
      stopReason: this.mapStopReason(response.stop_reason),
    };
  }

  protected mapMessages(messages: ChatMessage[]): unknown[] {
    return messages.map((msg) => {
      if (msg.role === 'tool') {
        const textContent =
          typeof msg.content === 'string'
            ? msg.content
            : msg.content
                .filter((b): b is TextBlock => b.type === 'text')
                .map((b) => b.text)
                .join('\n');

        return {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_use_id ?? '',
              content: textContent,
              ...(msg.is_error ? { is_error: true } : {}),
            },
          ],
        };
      }

      if (msg.role === 'assistant') {
        const content =
          typeof msg.content === 'string'
            ? [{ type: 'text', text: msg.content }]
            : msg.content.map((block) => this.mapOutgoingBlock(block));
        return { role: 'assistant', content };
      }

      if (typeof msg.content === 'string') {
        return { role: 'user', content: msg.content };
      }

      return {
        role: 'user',
        content: msg.content.map((block) => this.mapOutgoingBlock(block)),
      };
    });
  }

  protected mapTools(tools?: APIToolDefinition[]): unknown[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
      type: 'tool',
    }));
  }

  protected mapUsage(providerUsage: unknown): TokenUsage {
    const u = providerUsage as {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
    return {
      inputTokens: u.input_tokens,
      outputTokens: u.output_tokens,
      cacheReadTokens: u.cache_read_input_tokens,
      cacheWriteTokens: u.cache_creation_input_tokens,
    };
  }

  private mapOutgoingBlock(block: ContentBlock): Record<string, unknown> {
    switch (block.type) {
      case 'text':
        return { type: 'text', text: block.text };
      case 'tool_use':
        return { type: 'tool_use', id: block.id, name: block.name, input: block.input };
      case 'thinking':
        return { type: 'thinking', thinking: block.thinking };
      default:
        return { type: 'text', text: '' };
    }
  }
}
