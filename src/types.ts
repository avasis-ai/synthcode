export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; id: string; name: string; output: string; isError: boolean }
  | { type: "error"; error: Error }
  | { type: "done"; usage: TokenUsage; messages: Message[] };

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface ModelResponse {
  content: ContentBlock[];
  usage: TokenUsage;
  stopReason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
}

export interface ToolContext {
  cwd: string;
  env: Record<string, string>;
  abortSignal?: AbortSignal;
}

export interface ProviderConfig {
  model: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AgentConfig {
  model: import("./llm/provider.js").Provider;
  tools?: import("./tools/tool.js").Tool[];
  systemPrompt?: string;
  maxTurns?: number;
  context?: ContextConfig;
  permissions?: PermissionConfig;
  cwd?: string;
  maxRetries?: number;
  verifier?: import("./tools/verifier.js").ToolVerifier;
}

export interface ContextConfig {
  maxTokens?: number;
  compactThreshold?: number;
  maxOutputTokens?: number;
}

export interface PermissionConfig {
  allowedTools?: string[];
  deniedTools?: string[];
  askTools?: string[];
  defaultAction?: "allow" | "deny" | "ask";
}

export interface CompactionResult {
  messages: Message[];
  tokensSaved: number;
  method: "snip" | "compact" | "none";
}

export const DEFAULT_CONTEXT_WINDOW = 200_000;
export const DEFAULT_MAX_OUTPUT_TOKENS = 16_384;
export const DEFAULT_COMPACT_THRESHOLD = 0.85;
export const DEFAULT_MAX_TURNS = 100;
export const MAX_CONCURRENT_TOOLS = 10;
