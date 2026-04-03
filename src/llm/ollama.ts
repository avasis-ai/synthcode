import type { Provider, ChatRequest } from "./provider.js";
import { RetryableError } from "./provider.js";
import type { ModelResponse, ContentBlock } from "../types.js";
import type { APIToolDefinition } from "../tools/tool.js";

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
    const messages: any[] = [];

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

        const msg: any = {};
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

    const body: any = {
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

    const content: any[] = [];
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
}
