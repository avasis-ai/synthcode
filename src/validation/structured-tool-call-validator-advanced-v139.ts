import { Message, ToolUseBlock, ContentBlock } from "./types";

export interface ValidationContext {
  messageHistory: Message[];
  toolCallDependencies: Map<string, string[]>;
  runtimeState: Record<string, unknown>;
}

export interface Validator<T> {
  validate(data: T, context: ValidationContext): { isValid: boolean; errors: string[] };
}

export class StructuredToolCallValidatorAdvancedV139<T> implements Validator<T> {
  private validators: Validator<T>[] = [];
  private context: ValidationContext;

  constructor(context: ValidationContext) {
    this.context = context;
  }

  addValidator(validator: Validator<T>): StructuredToolCallValidatorAdvancedV139<T> {
    this.validators.push(validator);
    return this;
  }

  validate(data: T, context: ValidationContext): { isValid: boolean; errors: string[] } {
    if (context !== this.context) {
      throw new Error("Context mismatch: Validator initialized with a specific context.");
    }

    let allErrors: string[] = [];
    let isValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(data, context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        isValid = false;
      }
    }

    return { isValid, errors: allErrors };
  }
}

export class DependencyValidator implements Validator<ToolUseBlock> {
  validate(data: ToolUseBlock, context: ValidationContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredDependencies = context.toolCallDependencies.get(data.id);

    if (requiredDependencies) {
      for (const depId of requiredDependencies) {
        const isPresent = context.messageHistory.some(msg => {
          if (msg.role === "tool" && (msg as any).tool_use_id === depId) {
            return true;
          }
          return false;
        });
        if (!isPresent) {
          errors.push(`Dependency missing: Tool call ${data.id} requires previous tool result ${depId}.`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

export class StateValidator implements Validator<ToolUseBlock> {
  validate(data: ToolUseBlock, context: ValidationContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredStateKey = `tool_call:${data.id}:required_state`;
    const currentState = context.runtimeState[requiredStateKey];

    if (currentState === undefined) {
      errors.push(`State validation failed: No required state found for tool call ${data.id}.`);
    } else if (typeof currentState !== 'boolean' || currentState !== true) {
      errors.push(`State validation failed: Expected boolean true for tool call ${data.id}, got ${typeof currentState}.`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

export class ToolCallValidatorBuilder {
  private context: ValidationContext;

  constructor(context: ValidationContext) {
    this.context = context;
  }

  build(): StructuredToolCallValidatorAdvancedV139<ToolUseBlock> {
    const validator = new StructuredToolCallValidatorAdvancedV139<ToolUseBlock>(this.context);
    return validator;
  }

  withDependencyCheck(): ToolCallValidatorBuilder {
    return this;
  }

  withStateCheck(): ToolCallValidatorBuilder {
    return this;
  }
}

export {
  StructuredToolCallValidatorAdvancedV139,
  ToolCallValidatorBuilder,
  DependencyValidator,
  StateValidator
};