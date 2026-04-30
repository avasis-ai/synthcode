import { ContextManager } from "./context-manager";
import { KnowledgeGraph } from "./knowledge-graph";

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
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface EnrichedContext {
  messages: Message[];
  userIntentHistory: { vector: Float32Array; timestamp: number }[];
  systemConstraintsSummary: string;
  recentToolOutputs: Record<string, string>;
}

export class StructuredToolCallValidatorContextEnricher {
  private contextManager: ContextManager;
  private knowledgeGraph: KnowledgeGraph;

  constructor(contextManager: ContextManager, knowledgeGraph: KnowledgeGraph) {
    this.contextManager = contextManager;
    this.knowledgeGraph = knowledgeGraph;
  }

  enrich(
    messages: Message[],
    currentInput: string
  ): EnrichedContext {
    const userIntentHistory = this.contextManager.getIntentHistory(
      messages
    );

    const systemConstraintsSummary = this.knowledgeGraph.getSystemConstraints(
      messages
    );

    const recentToolOutputs = this.contextManager.getRecentToolOutputs(
      messages
    );

    return {
      messages: messages,
      userIntentHistory: userIntentHistory,
      systemConstraintsSummary: systemConstraintsSummary,
      recentToolOutputs: recentToolOutputs,
    };
  }
}