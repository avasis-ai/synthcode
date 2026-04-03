import type { ModelResponse, ContentBlock, TextBlock, ToolUseBlock, TokenUsage, ProviderConfig } from '../types.js';
import type { ChatRequest, ChatMessage, APIToolDefinition } from './provider.js';
import { BaseProvider, RetryableError } from './provider.js';

export interface OpenAIProviderConfig extends ProviderConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

export class OpenAIProvider extends BaseProvider {
  private readonly apiKey: string;
  private readonly baseURL?: string;
  private readonly organization?: string;
  private client: any = null;

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

    let response: any;
    try {
      response = await this.client.chat.completions.create(body, reqOptions);
    } catch (err: unknown) {
      const status = (err as any)?.status;
      const code = (err as any)?.code;
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
        } catch {}
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
