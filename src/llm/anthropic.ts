import type { ModelResponse, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock, TokenUsage, ProviderConfig } from '../types.js';
import type { ChatRequest, ChatMessage, APIToolDefinition } from './provider.js';
import { BaseProvider, RetryableError } from './provider.js';
import type { StreamEvent } from '../stream.js';

export interface AnthropicProviderConfig extends ProviderConfig {
  apiKey: string;
  baseURL?: string;
  dangerouslySkipAuth?: boolean;
  enableCaching?: boolean;
}

interface AnthropicClient {
  messages: {
    create(body: unknown, options?: unknown): Promise<unknown>;
    stream(body: unknown, options?: unknown): AsyncIterable<unknown>;
  };
}

interface AnthropicMessageResponse {
  content: Array<{
    type: string;
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
    thinking?: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  stop_reason: string;
}

export class AnthropicProvider extends BaseProvider {
  private readonly apiKey: string;
  private readonly baseURL?: string;
  private readonly dangerouslySkipAuth?: boolean;
  private readonly enableCaching: boolean;
  private client: AnthropicClient | null = null;

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

    let response: AnthropicMessageResponse;
    try {
      response = (await this.client.messages.create(body, reqOptions)) as AnthropicMessageResponse;
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

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamEvent> {
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

    const toolAccumulators: Map<number, { id: string; name: string; input: string }> = new Map();
    let usage: TokenUsage | undefined;

    try {
      const stream = this.client.messages.stream(body, reqOptions) as AsyncIterable<any>;

      for await (const event of stream) {
        switch (event.type) {
          case "message_start": {
            const msg = event.message;
            if (msg?.usage) {
              usage = {
                inputTokens: msg.usage.input_tokens ?? 0,
                outputTokens: 0,
                cacheReadTokens: msg.usage.cache_read_input_tokens,
                cacheWriteTokens: msg.usage.cache_creation_input_tokens,
              };
            }
            break;
          }
          case "content_block_start": {
            const block = event.content_block;
            if (block?.type === "tool_use") {
              toolAccumulators.set(event.index, { id: block.id, name: block.name, input: "" });
              yield { type: "tool_use_start", id: block.id, name: block.name };
            }
            break;
          }
          case "content_block_delta": {
            const delta = event.delta;
            if (delta?.type === "text_delta" && delta.text) {
              yield { type: "text_delta", text: delta.text };
            } else if (delta?.type === "input_json_delta" && delta.partial_json != null) {
              const toolBlock = toolAccumulators.get(event.index);
              if (toolBlock) {
                toolBlock.input += delta.partial_json;
                yield { type: "tool_use_delta", id: toolBlock.id, input: delta.partial_json };
              }
            }
            break;
          }
          case "message_delta": {
            const eventUsage = event.usage;
            if (usage && eventUsage) {
              usage = {
                ...usage,
                outputTokens: eventUsage.output_tokens ?? 0,
              };
            } else if (eventUsage) {
              usage = {
                inputTokens: 0,
                outputTokens: eventUsage.output_tokens ?? 0,
              };
            }
            yield { type: "done", usage };
            break;
          }
        }
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const code = (err as { code?: string })?.code;
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
