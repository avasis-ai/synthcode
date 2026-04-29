import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ContextPayload = {
  history: Message[];
  goal: string;
  current_step_context: Record<string, unknown>;
};

export type ContextualRule<T> = (context: ContextPayload, data: T) => { isValid: boolean; message: string };

export interface SchemaValidator<T> {
  validate: (data: T) => { isValid: boolean; message: string };
}

export class ContextualOutputValidator<T> implements SchemaValidator<T> {
  private schemaValidator: SchemaValidator<T>;
  private contextualRules: ContextualRule<T>[];

  constructor(schemaValidator: SchemaValidator<T>, contextualRules: ContextualRule<T>[] = []) {
    this.schemaValidator = schemaValidator;
    this.contextualRules = contextualRules;
  }

  public validate(data: T): { isValid: boolean; message: string } {
    // 1. Validate against the base schema first
    const schemaResult = this.schemaValidator.validate(data);
    if (!schemaResult.isValid) {
      return schemaResult;
    }

    // 2. Validate against all contextual rules
    for (const rule of this.contextualRules) {
      // We need a placeholder context for the rule execution.
      // In a real system, the calling pipeline would provide the actual context.
      // For this implementation, we assume a minimal context if none is passed during validation call.
      const dummyContext: ContextPayload = {
        history: [],
        goal: "N/A",
        current_step_context: {},
      };

      const contextResult = rule(dummyContext, data);
      if (!contextResult.isValid) {
        return { isValid: false, message: `Contextual validation failed: ${contextResult.message}` };
      }
    }

    return { isValid: true, message: "Validation successful." };
  }

  public addContextualRule(rule: ContextualRule<T>): ContextualOutputValidator<T> {
    this.contextualRules.push(rule);
    return this;
  }
}