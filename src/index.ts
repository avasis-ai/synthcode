export { Agent } from "./agent.js";
export type { AgentConfigV2 } from "./agent.js";
export { agentLoop } from "./loop.js";
export type { AgentLoopConfig } from "./loop.js";

export {
  defineTool,
  defineToolFromClass,
} from "./tools/tool.js";
export { ToolRegistry } from "./tools/registry.js";
export { orchestrateTools, ToolVerifier } from "./tools/orchestrator.js";
export type { Tool, ToolExecuteOptions, APIToolDefinition } from "./tools/tool.js";
export type { ToolExecutionResult, VerificationCheck, VerificationResult, VerificationRule, VerificationContext } from "./tools/orchestrator.js";
export { BashTool } from "./tools/bash.js";
export { FileReadTool } from "./tools/file-read.js";
export { FileWriteTool } from "./tools/file-write.js";
export { FileEditTool } from "./tools/file-edit.js";
export { GlobTool } from "./tools/glob.js";
export { GrepTool } from "./tools/grep.js";
export { WebFetchTool } from "./tools/web-fetch.js";
export { fuzzyReplace, fuzzyContains, FuzzyEditError } from "./tools/fuzzy-edit.js";

export { ContextManager } from "./context/manager.js";
export { estimateTokens, estimateMessageTokens, estimateConversationTokens } from "./context/tokenizer.js";
export type { TokenCount } from "./context/tokenizer.js";
export type { ContextCheck } from "./context/manager.js";

export { PermissionEngine } from "./permissions/engine.js";
export type { PermissionResult } from "./permissions/engine.js";
export type { PermissionConfig } from "./types.js";

export { createProvider, BaseProvider, RetryableError } from "./llm/index.js";
export { AnthropicProvider, OpenAIProvider, OllamaProvider, ClusterProvider } from "./llm/index.js";
export { anthropic, openai, ollama, cluster } from "./llm/index.js";
export type { Provider, ChatRequest, ChatMessage, ClusterConfig, ClusterSlot } from "./llm/index.js";

export { HookRunner } from "./hooks.js";
export type { AgentHooks } from "./hooks.js";

export { createStreamAggregator } from "./stream.js";
export type { StreamEvent } from "./stream.js";

export { InMemoryStore } from "./memory/index.js";
export { SQLiteStore } from "./memory/index.js";
export type { MemoryStore } from "./memory/index.js";

export { CostTracker } from "./cost/index.js";
export { DEFAULT_PRICING } from "./cost/index.js";
export type { CostRecord, ModelPricing } from "./cost/index.js";

export { MCPClient, loadMCPTools } from "./mcp/index.js";
export type { MCPServerConfig, MCPToolDefinition } from "./mcp/index.js";

export { init } from "./cli/index.js";
export type { InitOptions } from "./cli/init.js";

export type {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
  LoopEvent,
  TokenUsage,
  ModelResponse,
  ToolContext,
  AgentConfig,
  ContextConfig,
  CompactionResult,
} from "./types.js";

export {
  DEFAULT_CONTEXT_WINDOW,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_COMPACT_THRESHOLD,
  DEFAULT_MAX_TURNS,
  MAX_CONCURRENT_TOOLS,
} from "./types.js";

export { CircuitBreaker } from "./circuit-breaker.js";

export { ModelRegistry } from "./model/index.js";
export { OpenAICompatAdapter, AnthropicAdapter, GoogleAIAdapter } from "./model/index.js";
export { BENCHMARK_PRESETS } from "./model/index.js";
export type {
  ModelInfo,
  ModelCapability,
  BenchmarkResult,
  BenchmarkConfig,
  BenchmarkPreset,
  SelectionCriteria,
  RankedModel,
  ProviderAdapter,
} from "./model/index.js";

export { DualPathVerifier, WorldModel, runFastPath, runSlowPath, DEFAULT_ROUTING_POLICY } from "./verify/index.js";
export type {
  SafetyClass,
  Verdict,
  FastPathResult,
  SlowPathResult,
  DualPathVerdict,
  ToolOperation,
  RoutingPolicy,
} from "./verify/index.js";
