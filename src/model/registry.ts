import type { ModelInfo, BenchmarkResult, BenchmarkConfig, BenchmarkPreset, SelectionCriteria, RankedModel, ProviderAdapter } from "./types.js";
import { OpenAICompatAdapter } from "./adapters.js";

export const BENCHMARK_PRESETS: Record<BenchmarkPreset, BenchmarkConfig> = {
  latency: {
    prompt: "Say hello in exactly 10 words.",
    maxTokens: 30,
    runs: 5,
    warmup: 1,
    streaming: false,
  },
  throughput: {
    prompt: "Explain the difference between REST and GraphQL in about 200 words.",
    maxTokens: 400,
    runs: 3,
    warmup: 1,
    streaming: false,
  },
  code_apply: {
    prompt: 'Fix the bug in this function. Return ONLY the corrected function.\n\ndef add(a, b):\n    return a - b',
    maxTokens: 100,
    runs: 5,
    warmup: 1,
    streaming: false,
  },
  streaming: {
    prompt: "Write a short paragraph about artificial intelligence.",
    maxTokens: 200,
    runs: 3,
    warmup: 1,
    streaming: true,
  },
};

export class ModelRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();
  private modelCache: Map<string, ModelInfo[]> = new Map();
  private benchmarkCache: Map<string, BenchmarkResult> = new Map();

  registerAdapter(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  registerOpenAICompat(name: string, baseURL: string, headers?: Record<string, string>): void {
    this.adapters.set(name, new OpenAICompatAdapter(name, baseURL, headers));
  }

  getAdapter(name: string): ProviderAdapter | undefined {
    return this.adapters.get(name);
  }

  listAdapters(): string[] {
    return [...this.adapters.keys()];
  }

  async listModels(provider?: string): Promise<ModelInfo[]> {
    if (provider) {
      if (this.modelCache.has(provider)) return this.modelCache.get(provider)!;
      const adapter = this.adapters.get(provider);
      if (!adapter) return [];
      const models = await adapter.listModels();
      this.modelCache.set(provider, models);
      return models;
    }

    const all: ModelInfo[] = [];
    for (const [name, adapter] of this.adapters) {
      if (this.modelCache.has(name)) {
        all.push(...this.modelCache.get(name)!);
      } else {
        const models = await adapter.listModels();
        this.modelCache.set(name, models);
        all.push(...models);
      }
    }
    return all;
  }

  async benchmark(
    provider: string,
    modelId: string,
    presetOrConfig: BenchmarkPreset | BenchmarkConfig = "latency",
    apiKey?: string,
    baseURL?: string,
  ): Promise<BenchmarkResult> {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Unknown provider: ${provider}`);

    const config = typeof presetOrConfig === "string"
      ? BENCHMARK_PRESETS[presetOrConfig]
      : presetOrConfig;

    const result = await adapter.benchmark(modelId, config, apiKey ?? "", baseURL);
    const cacheKey = `${provider}:${modelId}:${typeof presetOrConfig === "string" ? presetOrConfig : "custom"}`;
    this.benchmarkCache.set(cacheKey, result);
    return result;
  }

  async benchmarkAll(
    preset: BenchmarkPreset = "latency",
    apiKeys?: Record<string, string>,
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const models = await this.listModels();

    for (const model of models) {
      const adapter = this.adapters.get(model.provider);
      if (!adapter) continue;
      const key = apiKeys?.[model.provider] ?? "";
      try {
        const result = await this.benchmark(model.provider, model.id, preset, key);
        results.push(result);
      } catch {
        results.push({
          modelId: model.id,
          provider: model.provider,
          latencyMs: 0, ttftMs: 0, outputTokens: 0, totalTokens: 0,
          tokPerSec: 0, promptTokens: 0, success: false,
          error: "Benchmark failed",
          timestamp: Date.now(),
        });
      }
    }

    return results.sort((a, b) => b.tokPerSec - a.tokPerSec);
  }

  async healthCheck(provider: string, modelId: string, apiKey?: string): Promise<boolean> {
    const adapter = this.adapters.get(provider);
    if (!adapter) return false;
    return adapter.healthCheck(modelId, apiKey ?? "");
  }

  async recommend(criteria: SelectionCriteria = {}): Promise<RankedModel[]> {
    const models = await this.listModels();
    const ranked: RankedModel[] = [];

    for (const model of models) {
      const { score, reasons } = this.scoreModel(model, criteria);

      if (criteria.minTokPerSec !== undefined || criteria.maxLatencyMs !== undefined) {
        const cached = this.findBenchmark(model.provider, model.id);
        if (cached && criteria.minTokPerSec !== undefined && cached.tokPerSec < criteria.minTokPerSec) continue;
        if (cached && criteria.maxLatencyMs !== undefined && cached.latencyMs > criteria.maxLatencyMs) continue;
        ranked.push({ model, score, benchmark: cached, reasons });
      } else {
        ranked.push({ model, score, reasons });
      }
    }

    return ranked.sort((a, b) => b.score - a.score);
  }

  getCachedBenchmark(provider: string, modelId: string): BenchmarkResult | undefined {
    return this.findBenchmark(provider, modelId);
  }

  clearCache(): void {
    this.modelCache.clear();
    this.benchmarkCache.clear();
  }

  private scoreModel(model: ModelInfo, criteria: SelectionCriteria): { score: number; reasons: string[] } {
    let score = 50;
    const reasons: string[] = [];

    if (criteria.requireCapabilities) {
      for (const cap of criteria.requireCapabilities) {
        if (!model.tags.includes(cap)) {
          if (cap === "tool_use" && !model.supportsToolUse) return { score: 0, reasons: ["Missing required capability: " + cap] };
          if (cap === "vision" && !model.supportsVision) return { score: 0, reasons: ["Missing required capability: " + cap] };
        }
      }
    }

    if (criteria.minContextWindow && model.contextWindow < criteria.minContextWindow) {
      return { score: 0, reasons: [`Context window too small: ${model.contextWindow} < ${criteria.minContextWindow}`] };
    }

    if (criteria.maxInputCostPer1M && model.pricing && model.pricing.inputPerMillion > criteria.maxInputCostPer1M) {
      return { score: 0, reasons: [`Input cost too high: $${model.pricing.inputPerMillion}/1M > $${criteria.maxInputCostPer1M}/1M`] };
    }

    if (criteria.maxOutputCostPer1M && model.pricing && model.pricing.outputPerMillion > criteria.maxOutputCostPer1M) {
      return { score: 0, reasons: [`Output cost too high: $${model.pricing.outputPerMillion}/1M`] };
    }

    if (criteria.preferFast || criteria.task === "apply") {
      if (model.tags.includes("fast")) { score += 20; reasons.push("Fast model"); }
      if (model.tags.includes("code")) { score += 15; reasons.push("Code-optimized"); }
    }

    if (criteria.preferCheap) {
      if (model.pricing) {
        const totalCost = model.pricing.inputPerMillion + model.pricing.outputPerMillion;
        if (totalCost < 1) { score += 25; reasons.push("Very cheap"); }
        else if (totalCost < 5) { score += 15; reasons.push("Affordable"); }
      }
      if (model.tags.includes("cheap")) { score += 10; reasons.push("Tagged cheap"); }
    }

    if (criteria.preferLocal || criteria.task === "code") {
      if (model.tags.includes("local")) { score += 20; reasons.push("Local model"); }
    }

    if (criteria.task === "code" || criteria.task === "apply") {
      if (model.tags.includes("code")) { score += 20; reasons.push("Code-specialized"); }
    }

    if (model.contextWindow >= 100000) { score += 5; reasons.push("Large context"); }
    if (model.supportsToolUse) { score += 5; reasons.push("Tool use support"); }
    if (model.supportsVision) { score += 3; reasons.push("Vision support"); }

    const cached = this.findBenchmark(model.provider, model.id);
    if (cached && cached.success) {
      if (cached.tokPerSec > 1000) { score += 15; reasons.push(`${cached.tokPerSec} tok/s`); }
      else if (cached.tokPerSec > 100) { score += 10; reasons.push(`${cached.tokPerSec} tok/s`); }
      else if (cached.tokPerSec > 30) { score += 5; reasons.push(`${cached.tokPerSec} tok/s`); }
    }

    return { score, reasons };
  }

  private findBenchmark(provider: string, modelId: string): BenchmarkResult | undefined {
    for (const [key, result] of this.benchmarkCache) {
      if (key.startsWith(`${provider}:${modelId}:`)) return result;
    }
    return undefined;
  }
}
