import type { ProviderAdapter, ModelInfo, BenchmarkResult, BenchmarkConfig } from "./types.js";

export class OpenAICompatAdapter implements ProviderAdapter {
  readonly name: string;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(name: string, baseURL: string, defaultHeaders?: Record<string, string>) {
    this.name = name;
    this.baseURL = baseURL.replace(/\/$/, "");
    this.defaultHeaders = defaultHeaders ?? {};
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const res = await fetch(`${this.baseURL}/models`, {
        headers: { ...this.defaultHeaders },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const models = data.data ?? data.models ?? [];
      return models.map((m: Record<string, unknown>) => this.parseModel(m));
    } catch {
      return [];
    }
  }

  async benchmark(modelId: string, config: BenchmarkConfig, apiKey: string, baseURL?: string): Promise<BenchmarkResult> {
    const base = baseURL ?? this.baseURL;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.defaultHeaders,
    };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const results: Array<{latencyMs: number; ttftMs: number; outputTokens: number; promptTokens: number; totalTokens: number}> = [];

    for (let run = -config.warmup; run < config.runs; run++) {
      const start = performance.now();
      let ttftMs = 0;
      let firstToken = true;

      try {
        if (config.streaming) {
          const res = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: "user", content: config.prompt }],
              max_tokens: config.maxTokens,
              stream: true,
            }),
          });

          let outputTokens = 0;
          let totalTokens = 0;
          let promptTokens = 0;
          let content = "";
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const d = line.slice(6).trim();
              if (d === "[DONE]") continue;
              try {
                const json = JSON.parse(d);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  if (firstToken) { ttftMs = performance.now() - start; firstToken = false; }
                  content += delta;
                }
                if (json.usage) {
                  outputTokens = json.usage.completion_tokens ?? 0;
                  promptTokens = json.usage.prompt_tokens ?? 0;
                  totalTokens = json.usage.total_tokens ?? 0;
                }
              } catch {}
            }
          }

          const latencyMs = performance.now() - start;
          if (outputTokens === 0) outputTokens = Math.round(content.length / 4);

          if (run >= 0) {
            results.push({ latencyMs, ttftMs, outputTokens, promptTokens, totalTokens });
          }
        } else {
          const res = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: "user", content: config.prompt }],
              max_tokens: config.maxTokens,
            }),
          });
          const data = await res.json();
          const latencyMs = performance.now() - start;
          const outputTokens = data.usage?.completion_tokens ?? 0;
          const promptTokens = data.usage?.prompt_tokens ?? 0;
          const totalTokens = data.usage?.total_tokens ?? 0;

          if (run >= 0) {
            results.push({ latencyMs, ttftMs: latencyMs, outputTokens, promptTokens, totalTokens });
          }
        }
      } catch (e: any) {
        if (run >= 0) {
          return {
            modelId,
            provider: this.name,
            latencyMs: 0,
            ttftMs: 0,
            outputTokens: 0,
            totalTokens: 0,
            tokPerSec: 0,
            promptTokens: 0,
            success: false,
            error: e.message,
            timestamp: Date.now(),
          };
        }
      }
    }

    if (results.length === 0) {
      return {
        modelId, provider: this.name,
        latencyMs: 0, ttftMs: 0, outputTokens: 0, totalTokens: 0,
        tokPerSec: 0, promptTokens: 0, success: false,
        error: "No successful runs", timestamp: Date.now(),
      };
    }

    const avgLatency = results.reduce((s, r) => s + r.latencyMs, 0) / results.length;
    const avgTtft = results.reduce((s, r) => s + r.ttftMs, 0) / results.length;
    const avgOutput = results.reduce((s, r) => s + r.outputTokens, 0) / results.length;
    const avgPrompt = results.reduce((s, r) => s + r.promptTokens, 0) / results.length;
    const avgTotal = results.reduce((s, r) => s + r.totalTokens, 0) / results.length;
    const tokPerSec = avgOutput > 0 && avgLatency > 0 ? avgOutput / (avgLatency / 1000) : 0;

    return {
      modelId,
      provider: this.name,
      latencyMs: Math.round(avgLatency),
      ttftMs: Math.round(avgTtft),
      outputTokens: Math.round(avgOutput),
      totalTokens: Math.round(avgTotal),
      tokPerSec: Math.round(tokPerSec * 10) / 10,
      promptTokens: Math.round(avgPrompt),
      success: true,
      timestamp: Date.now(),
    };
  }

  async healthCheck(modelId: string, apiKey: string, baseURL?: string): Promise<boolean> {
    const base = baseURL ?? this.baseURL;
    const headers: Record<string, string> = { "Content-Type": "application/json", ...this.defaultHeaders };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private parseModel(m: Record<string, unknown>): ModelInfo {
    const id = (m.id ?? m.name ?? m.model ?? "") as string;
    const contextWindow = (m.context_length ?? m.context_window ?? m.max_context_length ?? 4096) as number;
    const maxOutput = (m.max_output_tokens ?? m.max_tokens ?? 4096) as number;

    return {
      id,
      name: (m.name ?? m.id ?? id) as string,
      provider: this.name,
      contextWindow,
      maxOutputTokens: maxOutput,
      supportsToolUse: (m.supports_tool_use ?? m.tool_use ?? true) as boolean,
      supportsStreaming: true,
      supportsVision: (m.supports_vision ?? m.vision ?? false) as boolean,
      supportsThinking: (m.supports_thinking ?? false) as boolean,
      tags: this.inferTags(id),
    };
  }

  private inferTags(id: string): string[] {
    const tags: string[] = [];
    const lower = id.toLowerCase();
    if (lower.includes("fast") || lower.includes("flash") || lower.includes("mini")) tags.push("fast");
    if (lower.includes("cheap") || lower.includes("lite")) tags.push("cheap");
    if (lower.includes("code") || lower.includes("coder") || lower.includes("morph")) tags.push("code");
    if (lower.includes("local") || lower.includes("ollama")) tags.push("local");
    if (lower.includes("vision") || lower.includes("pro")) tags.push("vision");
    if (lower.includes("think") || lower.includes("reason")) tags.push("thinking");
    return tags;
  }
}

export class AnthropicAdapter implements ProviderAdapter {
  readonly name = "anthropic";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      this.makeModel("claude-sonnet-4-20250514", "Claude Sonnet 4", 200000, 16384, 3, 15),
      this.makeModel("claude-opus-4-20250514", "Claude Opus 4", 200000, 16384, 15, 75),
      this.makeModel("claude-3-5-haiku-20241022", "Claude 3.5 Haiku", 200000, 8192, 0.8, 4),
    ];
  }

  async benchmark(modelId: string, config: BenchmarkConfig, apiKey?: string): Promise<BenchmarkResult> {
    const key = apiKey ?? this.apiKey;
    const results: Array<{latencyMs: number; outputTokens: number; promptTokens: number}> = [];

    for (let run = -config.warmup; run < config.runs; run++) {
      const start = performance.now();
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: modelId,
            max_tokens: config.maxTokens,
            messages: [{ role: "user", content: config.prompt }],
          }),
        });
        const data = await res.json();
        const latencyMs = performance.now() - start;
        if (run >= 0) {
          results.push({
            latencyMs,
            outputTokens: data.usage?.output_tokens ?? 0,
            promptTokens: data.usage?.input_tokens ?? 0,
          });
        }
      } catch (e: any) {
        if (run >= 0) {
          return { modelId, provider: this.name, latencyMs: 0, ttftMs: 0, outputTokens: 0, totalTokens: 0, tokPerSec: 0, promptTokens: 0, success: false, error: e.message, timestamp: Date.now() };
        }
      }
    }

    const avg = {
      latencyMs: results.reduce((s, r) => s + r.latencyMs, 0) / results.length,
      outputTokens: results.reduce((s, r) => s + r.outputTokens, 0) / results.length,
      promptTokens: results.reduce((s, r) => s + r.promptTokens, 0) / results.length,
    };

    return {
      modelId, provider: this.name,
      latencyMs: Math.round(avg.latencyMs),
      ttftMs: Math.round(avg.latencyMs),
      outputTokens: Math.round(avg.outputTokens),
      totalTokens: Math.round(avg.outputTokens + avg.promptTokens),
      tokPerSec: Math.round((avg.outputTokens / (avg.latencyMs / 1000)) * 10) / 10,
      promptTokens: Math.round(avg.promptTokens),
      success: true,
      timestamp: Date.now(),
    };
  }

  async healthCheck(modelId: string, apiKey?: string): Promise<boolean> {
    const key = apiKey ?? this.apiKey;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: modelId, max_tokens: 5, messages: [{ role: "user", content: "hi" }] }),
      });
      return res.ok;
    } catch { return false; }
  }

  private makeModel(id: string, name: string, ctx: number, maxOut: number, inputCost: number, outputCost: number): ModelInfo {
    return {
      id, name, provider: this.name, contextWindow: ctx, maxOutputTokens: maxOut,
      supportsToolUse: true, supportsStreaming: true, supportsVision: true, supportsThinking: false,
      pricing: { inputPerMillion: inputCost, outputPerMillion: outputCost, currency: "USD" },
      tags: ["code", "tool_use"],
    };
  }
}

export class GoogleAIAdapter implements ProviderAdapter {
  readonly name = "google";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      this.makeModel("gemini-2.5-flash-preview-05-20", "Gemini 2.5 Flash", 1048576, 65536, 0.15, 0.60, ["fast", "code", "vision"]),
      this.makeModel("gemini-2.5-pro-preview-05-06", "Gemini 2.5 Pro", 1048576, 65536, 1.25, 10.0, ["code", "vision", "thinking"]),
      this.makeModel("gemini-2.0-flash", "Gemini 2.0 Flash", 1048576, 8192, 0.10, 0.40, ["fast", "cheap"]),
    ];
  }

  async benchmark(modelId: string, config: BenchmarkConfig, apiKey?: string): Promise<BenchmarkResult> {
    const key = apiKey ?? this.apiKey;
    const base = "https://generativelanguage.googleapis.com/v1beta/openai";
    const adapter = new OpenAICompatAdapter(this.name, base);
    return adapter.benchmark(modelId, config, key);
  }

  async healthCheck(modelId: string, apiKey?: string): Promise<boolean> {
    const key = apiKey ?? this.apiKey;
    const adapter = new OpenAICompatAdapter(this.name, "https://generativelanguage.googleapis.com/v1beta/openai");
    return adapter.healthCheck(modelId, key);
  }

  private makeModel(id: string, name: string, ctx: number, maxOut: number, inputCost: number, outputCost: number, tags: string[]): ModelInfo {
    return {
      id, name, provider: this.name, contextWindow: ctx, maxOutputTokens: maxOut,
      supportsToolUse: true, supportsStreaming: true, supportsVision: true, supportsThinking: tags.includes("thinking"),
      pricing: { inputPerMillion: inputCost, outputPerMillion: outputCost, currency: "USD" },
      tags,
    };
  }
}
