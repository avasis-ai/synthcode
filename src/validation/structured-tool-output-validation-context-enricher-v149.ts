import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationContext {
  sessionState: Record<string, unknown>;
  availableTools: Record<string, { description: string; parameters: Record<string, any> }>;
  history: Message[];
}

export interface EnrichedToolOutput {
  rawOutput: Record<string, unknown>;
  context: ValidationContext;
  enrichedData: Record<string, unknown>;
}

type EnricherFunction = (
  rawOutput: Record<string, unknown>,
  context: ValidationContext
) => EnrichedToolOutput;

export const structuredToolOutputValidationContextEnricherV149: EnricherFunction = (
  rawOutput,
  context
): EnrichedToolOutput => {
  const enrichedData: Record<string, unknown> = {
    ...rawOutput,
    contextMetadata: {
      sessionState: context.sessionState,
      availableTools: context.availableTools,
      historySummary: context.history.map(msg => ({
        role: msg.role,
        contentSnippet: typeof msg.content === 'string' ? msg.content.substring(0, 50) + '...' : JSON.stringify(msg.content).substring(0, 50) + '...',
      })),
    },
  };

  return {
    rawOutput,
    context,
    enrichedData,
  };
};