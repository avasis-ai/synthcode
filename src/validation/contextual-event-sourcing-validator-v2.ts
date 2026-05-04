import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationFailure = {
  index: number;
  message: string;
  ruleName: string;
};

export interface EventSequenceRule {
  name: string;
  validate(
    previousEvent: Message,
    currentEvent: Message,
    history: Message[]
  ): ValidationFailure | null;
}

export class ContextualEventSourcingValidatorV2 {
  private rules: EventSequenceRule[] = [];

  private constructor() {}

  private static getInstance(): ContextualEventSourcingValidatorV2 {
    if (!ContextualEventSourcingValidatorV2.instance) {
      ContextualEventSourcingValidatorV2.instance = new ContextualEventSourcingValidatorV2();
    }
    return ContextualEventSourcingValidatorV2.instance;
  }

  public static getInstance(): ContextualEventSourcingValidatorV2 {
    return new ContextualEventSourcingValidatorV2();
  }

  public addRule(rule: EventSequenceRule): this {
    this.rules.push(rule);
    return this;
  }

  public validate(history: Message[]): ValidationFailure[] {
    const failures: ValidationFailure[] = [];
    if (history.length < 2) {
      return [];
    }

    for (let i = 1; i < history.length; i++) {
      const previousEvent = history[i - 1];
      const currentEvent = history[i];

      for (const rule of this.rules) {
        const failure = rule.validate(previousEvent, currentEvent, history);
        if (failure) {
          failures.push(failure);
        }
      }
    }
    return failures;
  }
}

export class RuleBuilder {
  private validator: ContextualEventSourcingValidatorV2;

  constructor() {
    this.validator = ContextualEventSourcingValidatorV2.getInstance();
  }

  public addRule(rule: EventSequenceRule): RuleBuilder {
    this.validator.addRule(rule);
    return this;
  }

  public build(): ContextualEventSourcingValidatorV2 {
    return this.validator;
  }
}

export const createRule = (
  name: string,
  validator: (
    previousEvent: Message,
    currentEvent: Message,
    history: Message[]
  ) => ValidationFailure | null
): EventSequenceRule => ({
  name,
  validate: validator,
});