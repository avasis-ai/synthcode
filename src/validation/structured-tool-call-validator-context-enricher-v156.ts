import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface StateManager {
  getRecentToolCalls(limit: number): { tool_use_id: string; tool_name: string; input: Record<string, unknown> }[];
  getCurrentState(): Record<string, any>;
}

interface ToolRegistry {
  getToolMetadata(toolName: string): { description: string; parameters: Record<string, any> } | undefined;
  getAllToolNames(): string[];
}

interface ValidationContext {
  history: Message[];
  currentState: Record<string, any>;
}

interface EnrichedContext {
  originalContext: ValidationContext;
  toolMetadata: Record<string, { description: string; parameters: Record<string, any> }>;
  recentToolUsage: { tool_use_id: string; tool_name: string; input: Record<string, unknown> }[];
  stateSnapshot: Record<string, any>;
}

export class StructuredToolCallValidatorContextEnricherV156 {
  private stateManager: StateManager;
  private toolRegistry: ToolRegistry;

  constructor(stateManager: StateManager, toolRegistry: ToolRegistry) {
    this.stateManager = stateManager;
    this.toolRegistry = toolRegistry;
  }

  enrich(context: ValidationContext): EnrichedContext {
    const recentToolCalls = this.stateManager.getRecentToolCalls(5);
    const allToolNames = this.toolRegistry.getAllToolNames();
    
    const toolMetadata: Record<string, { description: string; parameters: Record<string, any> }> = {};
    for (const toolName of allToolNames) {
      const metadata = this.toolRegistry.getToolMetadata(toolName);
      if (metadata) {
        toolMetadata[toolName] = {
          description: metadata.description,
          parameters: metadata.parameters,
        };
      }
    }

    const enrichedContext: EnrichedContext = {
      originalContext: context,
      toolMetadata: toolMetadata,
      recentToolUsage: recentToolCalls,
      stateSnapshot: this.stateManager.getCurrentState(),
    };

    return enrichedContext;
  }
}