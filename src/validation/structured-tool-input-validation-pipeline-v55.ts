import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
};

interface ValidationContext {
  input: Record<string, unknown>;
  messages: Message[];
  schema: Record<string, any>;
}

interface ValidationStep {
  execute(context: ValidationContext): ValidationResult;
}

class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  async validate(context: ValidationContext): Promise<ValidationResult> {
    let currentContext: ValidationContext = {
      input: { ...context.input },
      messages: [...context.messages],
      schema: context.schema,
    };

    for (const step of this.steps) {
      const result = step.execute(currentContext);
      if (!result.isValid) {
        return {
          isValid: false,
          errors: [...(result.errors || []), `Validation failed at step: ${step.constructor.name}`],
          context: currentContext.input,
        };
      }
      // Update context if the step modifies it (though for simplicity, we assume stateless steps here)
      if (result.context) {
        currentContext.input = { ...currentContext.input, ...result.context };
      }
    }

    return {
      isValid: true,
      errors: [],
      context: currentContext.input,
    };
  }
}

class RequiredFieldValidationStep implements ValidationStep {
  constructor(private fieldName: string) {}

  execute(context: ValidationContext): ValidationResult {
    const value = context.input[this.fieldName];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return {
        isValid: false,
        errors: [`Field '${this.fieldName}' is required and cannot be empty.`],
      };
    }
    return { isValid: true, errors: [] };
  }
}

class CrossFieldDependencyValidationStep implements ValidationStep {
  constructor(private dependency: (context: ValidationContext) => string[]) {}

  execute(context: ValidationContext): ValidationResult {
    const errors = this.dependency(context);
    if (errors.length > 0) {
      return {
        isValid: false,
        errors: errors,
      };
    }
    return { isValid: true, errors: [] };
  }
}

class TemporalConstraintValidationStep implements ValidationStep {
  constructor(private requiredFields: string[]) {}

  execute(context: ValidationContext): ValidationResult {
    const now = new Date();
    const errors: string[] = [];

    for (const field of this.requiredFields) {
      const value = context.input[field];
      if (value instanceof Date) {
        if (value > now) {
          errors.push(`Field '${field}' date cannot be in the future.`);
        }
      } else if (typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`Field '${field}' must be a valid date string.`);
        } else if (date > now) {
          errors.push(`Field '${field}' date cannot be in the future.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export {
  StructuredToolInputValidationPipeline,
  RequiredFieldValidationStep,
  CrossFieldDependencyValidationStep,
  TemporalConstraintValidationStep,
};