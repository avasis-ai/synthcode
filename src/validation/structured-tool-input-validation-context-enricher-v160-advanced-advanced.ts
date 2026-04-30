import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface DependencyContext {
  [key: string]: any;
}

export interface TemporalContext {
  lastInteractionTime: number;
  timeSinceLastEventMs: number;
}

export interface AdvancedContext {
  dependencies: DependencyContext;
  temporal: TemporalContext;
}

export interface ContextEnricher {
  enrichContext(
    context: {
      messages: Message[];
      currentToolUse: ToolUseBlock | null;
    }
  ): {
    enrichedContext: {
      messages: Message[];
      currentToolUse: ToolUseBlock | null;
      advancedContext: AdvancedContext;
    };
  };
}

export class StructuredToolInputValidationContextEnricherV160AdvancedAdvanced implements ContextEnricher {
  private readonly dependencyProvider: (context: { messages: Message[]; currentToolUse: ToolUseBlock | null }) => DependencyContext;
  private readonly temporalProvider: (context: { messages: Message[]; currentToolUse: ToolUseBlock | null }) => TemporalContext;

  constructor(
    dependencyProvider: (context: { messages: Message[]; currentToolUse: ToolUseBlock | null }) => DependencyContext,
    temporalProvider: (context: { messages: Message[]; currentToolUse: ToolUseBlock | null }) => TemporalContext
  ) {
    this.dependencyProvider = dependencyProvider;
    this.temporalProvider = temporalProvider;
  }

  enrichContext(
    context: {
      messages: Message[];
      currentToolUse: ToolUseBlock | null;
    }
  ): {
    enrichedContext: {
      messages: Message[];
      currentToolUse: ToolUseBlock | null;
      advancedContext: AdvancedContext;
    };
  } {
    const dependencyContext = this.dependencyProvider(context);
    const temporalContext = this.temporalProvider(context);

    const advancedContext: AdvancedContext = {
      dependencies: dependencyContext,
      temporal: temporalContext,
    };

    return {
      enrichedContext: {
        messages: context.messages,
        currentToolUse: context.currentToolUse,
        advancedContext: advancedContext,
      },
    };
  }
}