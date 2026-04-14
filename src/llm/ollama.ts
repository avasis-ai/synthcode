import type { Provider, ChatRequest } from "./provider.js";
import { RetryableError } from "./provider.js";
import type { ModelResponse, ContentBlock } from "../types.js";
import type { APIToolDefinition } from "../tools/tool.js";
import type { StreamEvent } from "../stream.js";

export interface OllamaProviderConfig {
  model: string;
  baseURL?: string;
}

export class OllamaProvider implements Provider {
  readonly model: string;
  private readonly baseURL: string;

  constructor(config: OllamaProviderConfig) {
    this.model = config.model;
    this.baseURL = config.baseURL ?? "http://localhost:11434/v1";
  }

  async chat(request: ChatRequest): Promise<ModelResponse> {
    const messages: Array<Record<string, unknown>> = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    for (const m of request.messages) {
      if (m.role === "tool") {
        messages.push({
          role: "tool" as const,
          tool_call_id: m.tool_use_id,
          content: m.content,
        });
        continue;
      }
      if (m.role === "assistant" && Array.isArray(m.content)) {
        const textParts = (m.content as ContentBlock[]).filter(b => b.type === "text");
        const toolParts = (m.content as ContentBlock[]).filter(b => b.type === "tool_use");

        const msg: Record<string, unknown> = {};
        if (textParts.length > 0) {
          msg.content = textParts.map(p => (p as { text: string }).text).join("");
        }
        if (toolParts.length > 0) {
          msg.tool_calls = toolParts.map(b => {
            const tb = b as { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
            return {
              id: tb.id,
              type: "function",
              function: { name: tb.name, arguments: JSON.stringify(tb.input) },
            };
          });
        }
        msg.role = "assistant";
        messages.push(msg);
        continue;
      }
      messages.push({ role: m.role, content: m.content });
    }

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      stream: false,
    };

    if (request.maxOutputTokens) {
      body.max_tokens = request.maxOutputTokens;
    }

    if (request.tools?.length) {
      body.tools = request.tools.map(t => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    let response;
    try {
      response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: request.abortSignal,
      });
    } catch (err) {
      if (err instanceof RetryableError) throw err;
      throw new RetryableError(
        `Ollama connection failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429 || response.status === 503 || response.status === 529) {
        throw new RetryableError(`Ollama API error ${response.status}: ${text.slice(0, 200)}`);
      }
      throw new Error(`Ollama API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error("Ollama returned no choices");
    }

    const content: ContentBlock[] = [];
    let stopReason: ModelResponse["stopReason"] = "end_turn";

    if (choice.message?.content) {
      let text = choice.message.content;
      text = text.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, "").trim();
      text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
      text = text.replace(/\[Thinking[^\]]*\]/gi, "").trim();
      if (text.length > 0) {
        content.push({ type: "text" as const, text });
      }
    }

    if (choice.message?.tool_calls?.length) {
      stopReason = "tool_use";
      for (const tc of choice.message.tool_calls) {
        let input: Record<string, unknown>;
        try {
          input = JSON.parse(tc.function.arguments);
        } catch {
          console.warn(`Failed to parse tool call arguments for ${tc.function.name}: ${tc.function.arguments?.slice(0, 100)}`);
          input = {};
        }
        content.push({
          type: "tool_use" as const,
          id: tc.id,
          name: tc.function.name,
          input,
        });
      }
    }

    return {
      content,
      stopReason,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
    };
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamEvent> {
    const messages: Array<Record<string, unknown>> = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    for (const m of request.messages) {
      if (m.role === "tool") {
        messages.push({
          role: "tool" as const,
          tool_call_id: m.tool_use_id,
          content: m.content,
        });
        continue;
      }
      if (m.role === "assistant" && Array.isArray(m.content)) {
        const textParts = (m.content as ContentBlock[]).filter(b => b.type === "text");
        const toolParts = (m.content as ContentBlock[]).filter(b => b.type === "tool_use");

        const msg: Record<string, unknown> = {};
        if (textParts.length > 0) {
          msg.content = textParts.map(p => (p as { text: string }).text).join("");
        }
        if (toolParts.length > 0) {
          msg.tool_calls = toolParts.map(b => {
            const tb = b as { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
            return {
              id: tb.id,
              type: "function",
              function: { name: tb.name, arguments: JSON.stringify(tb.input) },
            };
          });
        }
        msg.role = "assistant";
        messages.push(msg);
        continue;
      }
      messages.push({ role: m.role, content: m.content });
    }

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      stream: true,
    };

    if (request.maxOutputTokens) {
      body.max_tokens = request.maxOutputTokens;
    }

    if (request.tools?.length) {
      body.tools = request.tools.map(t => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: request.abortSignal,
      });
    } catch (err) {
      if (err instanceof RetryableError) throw err;
      throw new RetryableError(
        `Ollama connection failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429 || response.status === 503 || response.status === 529) {
        throw new RetryableError(`Ollama API error ${response.status}: ${text.slice(0, 200)}`);
      }
      throw new Error(`Ollama API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Ollama returned no response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    const toolCallAccumulators: Map<number, { id: string; name: string; arguments: string }> = new Map();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop()!;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") {
          yield { type: "done" };
          continue;
        }
        try {
          const chunk = JSON.parse(payload);
          const choice = chunk.choices?.[0];
          if (!choice) continue;

          if (choice.delta?.content) {
            yield { type: "text_delta", text: choice.delta.content };
          }

          if (choice.delta?.tool_calls) {
            for (const tc of choice.delta.tool_calls) {
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
            yield {
              type: "done",
              usage: {
                inputTokens: chunk.usage?.prompt_tokens ?? 0,
                outputTokens: chunk.usage?.completion_tokens ?? 0,
              },
            };
          }
        } catch {
          continue;
        }
      }
    }
  }
}
