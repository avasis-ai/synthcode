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

export interface AdvancedValidationContext {
  baseContext: {
    messages: Message[];
    history: any[];
    graphData: Record<string, any>;
  };
  enrichmentRules: AdvancedRule[];
  enrichedContext: {
    derivedState: Record<string, any>;
    flags: Record<string, boolean>;
  };
}

export interface AdvancedRule {
  name: string;
  execute: (context: {
    messages: Message[];
    history: any[];
    graphData: Record<string, any>;
  }) => {
    derivedState: Record<string, any>;
    flags: Record<string, boolean>;
  };
}

export class StructuredToolOutputValidationContextEnricher {
  private rules: AdvancedRule[];

  constructor(rules: AdvancedRule[] = []) {
    this.rules = rules;
  }

  enrich(baseContext: {
    messages: Message[];
    history: any[];
    graphData: Record<string, any>;
  }): AdvancedValidationContext {
    const initialContext: AdvancedValidationContext = {
      baseContext: {
        messages: baseContext.messages,
        history: baseContext.history,
        graphData: baseContext.graphData,
      },
      enrichmentRules: this.rules,
      enrichedContext: {
        derivedState: {},
        flags: {},
      },
    };

    let currentState: Record<string, any> = {};
    let currentFlags: Record<string, boolean> = {};

    for (const rule of this.rules) {
      const result = rule.execute(initialContext.baseContext);
      currentState = { ...currentState, ...result.derivedState };
      currentFlags = { ...currentFlags, ...result.flags };
    }

    return {
      ...initialContext,
      enrichedContext: {
        derivedState: currentState,
        flags: currentFlags,
      },
    };
  }
}