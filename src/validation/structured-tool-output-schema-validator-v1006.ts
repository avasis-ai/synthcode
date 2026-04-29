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

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface StructuralRule {
  name: string;
  validate(data: Record<string, unknown>): string[] | null;
}

export class StructuredToolOutputSchemaValidator {
  private rules: StructuralRule[];

  constructor(rules: StructuralRule[]) {
    this.rules = rules;
  }

  public validate(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    for (const rule of this.rules) {
      const ruleErrors = rule.validate(data);
      if (ruleErrors) {
        errors.push(...ruleErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  public static create(rules: StructuralRule[]): StructuredToolOutputSchemaValidator {
    return new StructuredToolOutputSchemaValidator(rules);
  }
}

export class StructuredToolOutputSchemaValidatorV1006 {
  private static readonly validator = StructuredToolOutputSchemaValidator.create([]);

  public static validate(data: Record<string, unknown>): ValidationResult {
    return this.validator.validate(data);
  }
}