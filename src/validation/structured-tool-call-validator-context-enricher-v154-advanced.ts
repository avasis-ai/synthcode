import { ContextManager } from "./context-manager";
import { HistoryStore } from "./history-store";
import { ConstraintStore } from "./constraint-store";
import { Message, ContentBlock, ToolUseBlock } from "../types";

export interface EnrichedContext {
  historySummary: string;
  projectContext: Record<string, unknown>;
  activeConstraints: Record<string, any>;
  recentToolUsage: {
    toolName: string;
    lastInput: Record<string, unknown>;
    usageCount: number;
  }[];
}

export class StructuredToolCallValidatorContextEnricher {
  private contextManager: ContextManager;
  private historyStore: HistoryStore;
  private constraintStore: ConstraintStore;

  constructor(
    contextManager: ContextManager,
    historyStore: HistoryStore,
    constraintStore: ConstraintStore
  ) {
    this.contextManager = contextManager;
    this.historyStore = historyStore;
    this.constraintStore = constraintStore;
  }

  enrich(
    currentMessages: Message[],
  ): EnrichedContext {
    const historySummary = this.historyStore.getSummary(currentMessages);
    const projectContext = this.contextManager.getProjectContext();
    const activeConstraints = this.constraintStore.getActiveConstraints();
    const recentToolUsage = this.getRecentToolUsage(currentMessages);

    return {
      historySummary,
      projectContext,
      activeConstraints,
      recentToolUsage,
    };
  }

  private getRecentToolUsage(
    messages: Message[]
  ): {
    toolName: string;
    lastInput: Record<string, unknown>;
    usageCount: number;
  >[] {
    const toolUses: ToolUseBlock[] = messages.flatMap(
      (msg) => {
        if (msg.role === "assistant" && msg.content) {
          return (msg.content as ContentBlock[]).filter(
            (block) => (block as ToolUseBlock).type === "tool_use"
          ) as ToolUseBlock[];
        }
        return [];
      }
    );

    const usageMap = new Map<string, {
      lastInput: Record<string, unknown>;
      usageCount: number;
    }>();

    for (const use of toolUses) {
      const toolName = use.name;
      if (!usageMap.has(toolName)) {
        usageMap.set(toolName, {
          lastInput: use.input,
          usageCount: 0,
        });
      }
      const usage = usageMap.get(toolName)!;
      usage.usageCount += 1;
      usage.lastInput = use.input;
    }

    return Array.from(usageMap.entries()).map(([
      toolName,
      usage
    ]) => ({
      toolName,
      lastInput: usage.lastInput,
      usageCount: usage.usageCount,
    }));
  }
}