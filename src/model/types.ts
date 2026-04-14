export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsToolUse: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsThinking: boolean;
  pricing?: ModelPricing;
  tags: string[];
}

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  currency: string;
}

export type ModelCapability =
  | "tool_use"
  | "streaming"
  | "vision"
  | "thinking"
  | "code"
  | "fast"
  | "cheap"
  | "local";

export interface BenchmarkResult {
  modelId: string;
  provider: string;
  latencyMs: number;
  ttftMs: number;
  outputTokens: number;
  totalTokens: number;
  tokPerSec: number;
  promptTokens: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface BenchmarkConfig {
  prompt: string;
  maxTokens: number;
  runs: number;
  warmup: number;
  streaming: boolean;
}

export type BenchmarkPreset = "latency" | "throughput" | "code_apply" | "streaming";

export interface SelectionCriteria {
  minTokPerSec?: number;
  maxLatencyMs?: number;
  maxInputCostPer1M?: number;
  maxOutputCostPer1M?: number;
  minContextWindow?: number;
  requireCapabilities?: ModelCapability[];
  preferLocal?: boolean;
  preferFast?: boolean;
  preferCheap?: boolean;
  task?: "code" | "chat" | "apply" | "analysis";
}

export interface RankedModel {
  model: ModelInfo;
  score: number;
  benchmark?: BenchmarkResult;
  reasons: string[];
}

export interface ProviderAdapter {
  readonly name: string;
  listModels(): Promise<ModelInfo[]>;
  benchmark(modelId: string, config: BenchmarkConfig, apiKey: string, baseURL?: string): Promise<BenchmarkResult>;
  healthCheck(modelId: string, apiKey: string, baseURL?: string): Promise<boolean>;
}
