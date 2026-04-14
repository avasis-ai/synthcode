import type { ModelResponse, ContentBlock, TextBlock, ToolUseBlock, TokenUsage, ProviderConfig } from '../types.js';
import type { ChatRequest, ChatMessage, APIToolDefinition } from './provider.js';
import { BaseProvider, RetryableError } from './provider.js';
import type { StreamEvent } from '../stream.js';

export interface OpenAIProviderConfig extends ProviderConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content?: string;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
}

interface OpenAIClient {
  chat: {
    completions: {
      create(body: unknown, options?: unknown): Promise<unknown>;
    };
  };
}

export class OpenAIProvider extends BaseProvider {
  private readonly apiKey: string;
  private readonly baseURL?: string;
  private readonly organization?: string;
  private client: OpenAIClient | null = null;

  constructor(config: OpenAIProviderConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.organization = config.organization;
  }

  async chat(request: ChatRequest): Promise<ModelResponse> {
    const OpenAI = (await import('openai')).default;

    if (!this.client) {
      const opts: Record<string, unknown> = { apiKey: this.apiKey };
      if (this.baseURL) opts.baseURL = this.baseURL;
      if (this.organization) opts.organization = this.organization;
      this.client = new OpenAI(opts);
    }

    const mappedMessages = this.mapMessages(request.messages);
    const messages: unknown[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push(...mappedMessages);

    const tools = this.mapTools(request.tools);
    const maxTokens = request.maxOutputTokens ?? this.maxOutputTokens;
    const temperature = request.temperature ?? this.temperature;

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      stream: false,
    };

    if (tools) body.tools = tools;
    if (maxTokens !== undefined) body.max_tokens = maxTokens;
    if (temperature !== undefined) body.temperature = temperature;

    const reqOptions: Record<string, unknown> = {};
    if (request.abortSignal) reqOptions.signal = request.abortSignal;

    try {
      const response = (await this.client.chat.completions.create(body, reqOptions)) as OpenAIChatResponse;

    const choice = response.choices[0];
    const content: ContentBlock[] = [];

    if (choice.message.content) {
      content.push({ type: 'text', text: choice.message.content } as TextBlock);
    }

    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tc.function.arguments);
        } catch {
          console.warn(`Failed to parse tool call arguments for ${tc.function.name}: ${tc.function.arguments?.slice(0, 100)}`);
        }
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input,
        } as ToolUseBlock);
      }
    }

    return {
      content,
      usage: this.mapUsage(response.usage),
      stopReason: this.mapStopReason(choice.finish_reason),
    };
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const code = (err as { code?: string })?.code;
      const isNetwork =
        err instanceof TypeError ||
        (typeof code === 'string' &&
          ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(code));

      if (status === 429 || isNetwork) {
        throw new RetryableError(
          err instanceof Error ? err.message : String(err),
          err instanceof Error ? err : undefined,
        );
      }
      throw new Error(
        `OpenAI API error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? { cause: err } : undefined,
      );
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamEvent> {
    const OpenAI = (await import('openai')).default;

    if (!this.client) {
      const opts: Record<string, unknown> = { apiKey: this.apiKey };
      if (this.baseURL) opts.baseURL = this.baseURL;
      if (this.organization) opts.organization = this.organization;
      this.client = new OpenAI(opts);
    }

    const mappedMessages = this.mapMessages(request.messages);
    const messages: unknown[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push(...mappedMessages);

    const tools = this.mapTools(request.tools);
    const maxTokens = request.maxOutputTokens ?? this.maxOutputTokens;
    const temperature = request.temperature ?? this.temperature;

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      stream: true,
    };
    if (tools) body.tools = tools;
    if (maxTokens !== undefined) body.max_tokens = maxTokens;
    if (temperature !== undefined) body.temperature = temperature;

    const reqOptions: Record<string, unknown> = {};
    if (request.abortSignal) reqOptions.signal = request.abortSignal;

    const toolCallAccumulators: Map<number, { id: string; name: string; arguments: string }> = new Map();
    let usage: TokenUsage | undefined;

    try {
      const stream = (this.client as any).chat.completions.create(body, reqOptions) as AsyncIterable<any>;

      for await (const chunk of stream) {
        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;
        if (delta?.content) {
          yield { type: "text_delta", text: delta.content };
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index as number;
            if (!toolCallAccumulators.has(idx)) {
              toolCallAccumulators.set(idx, {
                id: tc.id ?? "",
                name: tc.function?.name ?? "",
                arguments: "",
              });
              if (tc.id) {
                yield { type: "tool_use_start", id: tc.id, name: tc.function?.name ?? "" };
              }
            }
            const acc = toolCallAccumulators.get(idx)!;
            if (tc.id) acc.id = tc.id;
            if (tc.function?.name) acc.name = tc.function.name;
            if (tc.function?.arguments) {
              acc.arguments += tc.function.arguments;
              yield { type: "tool_use_delta", id: acc.id, input: tc.function.arguments };
            }
          }
        }

        if (choice.finish_reason) {
          if (chunk.usage) {
            usage = this.mapUsage(chunk.usage);
          }
          yield { type: "done", usage };
        }
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const code = (err as { code?: string })?.code;
      const isNetwork =
        err instanceof TypeError ||
        (typeof code === 'string' &&
          ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(code));

      if (status === 429 || isNetwork) {
        throw new RetryableError(
          err instanceof Error ? err.message : String(err),
          err instanceof Error ? err : undefined,
        );
      }
      throw new Error(
        `OpenAI API error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? { cause: err } : undefined,
      );
    }
  }

  protected mapMessages(messages: ChatMessage[]): unknown[] {
    return messages.map((msg) => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: msg.tool_use_id ?? '',
          content:
            typeof msg.content === 'string'
              ? msg.content
              : msg.content
                  .filter((b): b is TextBlock => b.type === 'text')
                  .map((b) => b.text)
                  .join('\n'),
        };
      }

      if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          return { role: 'assistant', content: msg.content };
        }

        const textParts = msg.content
          .filter((b): b is TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');
        const toolCalls = msg.content
          .filter((b): b is ToolUseBlock => b.type === 'tool_use')
          .map((b) => ({
            id: b.id,
            type: 'function' as const,
            function: { name: b.name, arguments: JSON.stringify(b.input) },
          }));

        return {
          role: 'assistant',
          content: textParts || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        };
      }

      return {
        role: 'user',
        content:
          typeof msg.content === 'string'
            ? msg.content
            : msg.content
                .filter((b): b is TextBlock => b.type === 'text')
                .map((b) => b.text)
                .join('\n'),
      };
    });
  }

  protected mapTools(tools?: APIToolDefinition[]): unknown[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
  }

  protected mapUsage(providerUsage: unknown): TokenUsage {
    const u = providerUsage as {
      prompt_tokens: number;
      completion_tokens: number;
      prompt_tokens_details?: { cached_tokens?: number };
    };
    return {
      inputTokens: u.prompt_tokens,
      outputTokens: u.completion_tokens,
      cacheReadTokens: u.prompt_tokens_details?.cached_tokens,
    };
  }
}
