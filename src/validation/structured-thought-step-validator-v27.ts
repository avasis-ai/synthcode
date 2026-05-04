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

type ValidatorResult = {
  isValid: boolean;
  errors: string[];
};

interface TransitionRule {
  fromRole: Message['role'];
  toRole: Message['role'];
  validate(from: Message, to: Message): string | null;
}

export class StructuredThoughtStepValidatorV27 {
  private rules: TransitionRule[] = [];

  private constructor() {}

  public static create(): StructuredThoughtStepValidatorV27 {
    return new StructuredThoughtStepValidatorV27();
  }

  public addRule(rule: TransitionRule): StructuredThoughtStepValidatorV27 {
    this.rules.push(rule);
    return this;
  }

  public validateSequence(sequence: Message[]): ValidatorResult {
    const errors: string[] = [];

    if (!sequence || sequence.length < 2) {
      return { isValid: true, errors: [] };
    }

    for (let i = 1; i < sequence.length; i++) {
      const fromMessage = sequence[i - 1];
      const toMessage = sequence[i];

      for (const rule of this.rules) {
        if (rule.fromRole === fromMessage.role && rule.toRole === toMessage.role) {
          const validationError = rule.validate(fromMessage, toMessage);
          if (validationError) {
            errors.push(
              `Transition validation failed between ${fromMessage.role} and ${toMessage.role}: ${validationError}`
            );
            // Found a specific rule failure, break inner loop to avoid redundant errors for this pair
            break;
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export const structuredThoughtStepValidatorV27 = {
  create: (): StructuredThoughtStepValidatorV27 => StructuredThoughtStepValidatorV27.create(),
};