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
  context?: Record<string, any>;
};

export interface ValidationContext {
  input: Record<string, unknown>;
  runtimeState: Record<string, any>;
}

export interface SchemaDefinition {
  [key: string]: any;
}

export interface ValidationStep {
  execute: (
    context: ValidationContext,
    schema: SchemaDefinition
  ) => ValidationResult;
}

interface ToolInputPipeline {
  validate: (
    input: Record<string, unknown>,
    context: Record<string, any>
  ) => ValidationResult;
}

class StructuredToolInputValidationPipelineV9 implements ToolInputPipeline {
  private steps: ValidationStep[];

  constructor(initialSteps: ValidationStep[] = []) {
    this.steps = initialSteps;
  }

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  validate(input: Record<string, unknown>, context: Record<string, any>): ValidationResult {
    let currentContext: ValidationContext = {
      input: input,
      runtimeState: context,
    };

    let accumulatedErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.execute(currentContext, {} as SchemaDefinition);
      if (!result.isValid) {
        accumulatedErrors = accumulatedErrors.concat(result.errors);
      }
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      context: currentContext.runtimeState,
    };
  }
}

class SchemaValidator implements ValidationStep {
  execute(context: ValidationContext, schema: SchemaDefinition): ValidationResult {
    const input = context.input;
    const errors: string[] = [];

    for (const key in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        const schemaDef = schema[key];
        const value = input[key];

        if (value === undefined) {
          if (schemaDef.required) {
            errors.push(`Missing required field: ${key}`);
          }
          continue;
        }

        if (typeof schemaDef.type === 'string') {
          switch (schemaDef.type) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`Field ${key} expected string, got ${typeof value}`);
              }
              break;
            case 'number':
              if (typeof value !== 'number') {
                errors.push(`Field ${key} expected number, got ${typeof value}`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                errors.push(`Field ${key} expected boolean, got ${typeof value}`);
              }
              break;
            default:
              // Basic type check passed for now
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

class ContextValidator implements ValidationStep {
  execute(context: ValidationContext, schema: SchemaDefinition): ValidationResult {
    const { input, runtimeState } = context;
    const errors: string[] = [];

    if (runtimeState.userIsAdmin === false && input.action === 'delete') {
      errors.push("Unauthorized: Only admins can perform delete actions.");
    }

    if (typeof input.itemId === 'string' && !input.itemId.startsWith('item-')) {
      errors.push("Invalid item ID format. Must start with 'item-'.");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

class CustomRuleValidator implements ValidationStep {
  execute(context: ValidationContext, schema: SchemaDefinition): ValidationResult {
    const { input } = context;
    const errors: string[] = [];

    if (input.quantity && input.quantity > 1000) {
      errors.push("Quantity exceeds the maximum allowed limit of 1000.");
    }

    if (input.itemId && input.itemId.length < 5) {
      errors.push("Item ID is too short.");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export const createStructuredToolInputValidationPipelineV9 = (
  initialSteps: ValidationStep[] = []
): StructuredToolInputValidationPipelineV9 => {
  const pipeline = new StructuredToolInputValidationPipelineV9(initialSteps);

  // Default steps for the advanced pipeline
  pipeline.addStep(new SchemaValidator());
  pipeline.addStep(new ContextValidator());
  pipeline.addStep(new CustomRuleValidator());

  return pipeline;
};