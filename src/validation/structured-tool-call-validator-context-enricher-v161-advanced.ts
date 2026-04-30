import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface IntendedPathContext {
  expectedNextTool?: string;
  requiredPrecedingTool?: string;
  allowedSequence?: string[];
}

export interface ValidationContext {
  history: Message[];
  currentState: Record<string, unknown>;
  intendedPath: IntendedPathContext;
}

export class StructuredToolCallValidatorContextEnricher {
  enrich(
    context: {
      history: Message[];
      currentState: Record<string, unknown>;
      intendedPath?: IntendedPathContext;
    }
  ): ValidationContext {
    const intendedPath = context.intendedPath
      ? {
          history: context.history,
          currentState: context.currentState,
          intendedPath: context.intendedPath,
        }
      : {
          history: context.history,
          currentState: context.currentState,
          intendedPath: {} as IntendedPathContext,
        };

    return intendedPath;
  }
}