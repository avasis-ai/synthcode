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

interface AdvancedSchemaRule<T> {
  validate(data: T, parentData: Record<string, unknown>): { isValid: boolean; message?: string };
}

type SchemaValidator = <T>(data: T, parentData: Record<string, unknown>) => { isValid: boolean; message?: string };

class StructuredToolOutputSchemaValidatorAdvancedAdvanced {
  private rules: SchemaValidator[];

  constructor() {
    this.rules = [];
  }

  addRule(rule: SchemaValidator): this {
    this.rules.push(rule);
    return this;
  }

  private validateStructure(data: Record<string, unknown>, parentData: Record<string, unknown>): { isValid: boolean; message?: string } {
    for (const rule of this.rules) {
      const result = rule(data as any, parentData);
      if (!result.isValid) {
        return { isValid: false, message: result.message };
      }
    }
    return { isValid: true };
  }

  public validate(data: Record<string, unknown>, parentData: Record<string, unknown>): { isValid: boolean; message?: string } {
    if (typeof data !== 'object' || data === null) {
      return { isValid: false, message: "Input data must be a non-null object." };
    }
    return this.validateStructure(data, parentData);
  }
}

export const createAdvancedSchemaValidator = (): StructuredToolOutputSchemaValidatorAdvancedAdvanced => {
  const validator = new StructuredToolOutputSchemaValidatorAdvancedAdvanced();

  // Example: Rule checking for required fields based on parent context
  const requiredFieldRule: SchemaValidator = (data, parentData) => {
    const requiredKey = "required_field";
    if (parentData[requiredKey] === "context_A" && !(requiredKey in data)) {
      return { isValid: false, message: `Missing required field '${requiredKey}' when parent context is 'context_A'.` };
    }
    return { isValid: true };
  };

  // Example: Conditional validation based on sibling field presence
  const conditionalFieldRule: SchemaValidator = (data, parentData) => {
    const hasToolUse = (data as any).tool_use_id !== undefined;
    const hasContent = (data as any).content !== undefined;

    if (hasToolUse && !hasContent) {
      return { isValid: false, message: "Tool use requires associated content." };
    }
    return { isValid: true };
  };

  validator.addRule(requiredFieldRule);
  validator.addRule(conditionalFieldRule);

  return validator;
};