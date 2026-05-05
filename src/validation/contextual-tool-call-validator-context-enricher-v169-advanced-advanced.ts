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

export interface AdvancedContextPayload {
  recentIntentShift?: {
    source: string;
    target: string;
    confidence: number;
  };
  graphConstraints?: Record<string, string>;
  crossStepDependencies?: Record<string, string>;
}

export interface ToolCallContext {
  history: Message[];
  currentState: Record<string, unknown>;
  advancedContext: AdvancedContextPayload;
}

export type ContextEnricher = (
  context: {
    history: Message[];
    currentState: Record<string, unknown>;
    advancedContext: AdvancedContextPayload;
  }
) => ToolCallContext;

const createAdvancedContextEnricher = (): ContextEnricher => {
  return (context) => {
    const enrichedContext: ToolCallContext = {
      history: context.history,
      currentState: context.currentState,
      advancedContext: context.advancedContext,
    };

    if (context.advancedContext.recentIntentShift) {
      console.log(
        `[Enricher] Detected intent shift from ${context.advancedContext.recentIntentShift.source} to ${context.advancedContext.recentIntentShift.target}. Confidence: ${context.advancedContext.recentIntentShift.confidence.toFixed(2)}`
      );
    }

    if (context.advancedContext.graphConstraints) {
      console.log(`[Enricher] Applying graph constraints: ${JSON.stringify(context.advancedContext.graphConstraints)}`);
    }

    if (context.advancedContext.crossStepDependencies) {
      console.log(`[Enricher] Incorporating cross-step dependencies: ${JSON.stringify(context.advancedContext.crossStepDependencies)}`);
    }

    return enrichedContext;
  };
};

export const contextualToolCallValidatorContextEnricher = createAdvancedContextEnricher();