import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ContextPayload {
  messages: Message[];
  history: { timestamp: number; context: Record<string, unknown> }[];
  metadata: Record<string, unknown>;
}

export interface ConstraintRule {
  name: string;
  validate: (context: ContextPayload) => string | null;
}

export class ContextualConstraintValidator {
  private rules: ConstraintRule[];

  constructor(rules: ConstraintRule[]) {
    this.rules = rules;
  }

  public validate(context: ContextPayload): ValidationResult {
    const errors: string[] = [];
    for (const rule of this.rules) {
      const violation = rule.validate(context);
      if (violation) {
        errors.push(`[${rule.name}]: ${violation}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}