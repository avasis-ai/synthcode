import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationRule = {
  check: (
    history: Message[],
    currentState: any,
    event: Message
  ) => { isValid: boolean; message?: string };
};

export type ContextualValidator = {
  rules: ValidationRule[];
  initialState: any;
  process: (events: Message[]) => { isValid: boolean; finalState: any; errors: string[] };
}

interface RuleBuilder {
  withRule: (rule: ValidationRule) => RuleBuilder;
  build: () => ContextualValidator;
}

class ContextualEventSourcingValidatorAdvancedAdvanced implements RuleBuilder {
  private rules: ValidationRule[] = [];
  private initialState: any;

  constructor(initialState: any) {
    this.initialState = initialState;
  }

  withRule(rule: ValidationRule): RuleBuilder {
    this.rules.push(rule);
    return this;
  }

  build(): ContextualValidator {
    return {
      rules: this.rules,
      initialState: this.initialState,
      process: this.process.bind(this)
    };
  }

  private process(events: Message[]): { isValid: boolean; finalState: any; errors: string[] } {
    let currentState: any = this.initialState;
    const errors: string[] = [];
    let isValid = true;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const history = events.slice(0, i);

      for (const rule of this.rules) {
        const { isValid: ruleValid, message: ruleMessage } = rule.check(history, currentState, event);
        if (!ruleValid) {
          isValid = false;
          errors.push(`Rule violation at event index ${i} (${event.role}): ${ruleMessage || "Unknown rule violation"}`);
        }
      }

      // Simulate state transition based on the event (simplified for this context)
      currentState = this.applyEventToState(currentState, event);
    }

    return {
      isValid,
      finalState: currentState,
      errors
    };
  }

  private applyEventToState(currentState: any, event: Message): any {
    // Placeholder for complex state transition logic
    if (event.role === "user") {
      return { ...currentState, userInteractionCount: (currentState.userInteractionCount || 0) + 1, lastUserMessage: event.content };
    }
    if (event.role === "assistant") {
      return { ...currentState, assistantTurnCount: (currentState.assistantTurnCount || 0) + 1, lastAssistantMessage: event.content };
    }
    return currentState;
  }
}

export const buildValidator = (initialState: any): RuleBuilder => {
  return new ContextualEventSourcingValidatorAdvancedAdvanced(initialState);
};