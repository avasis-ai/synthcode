import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ValidationContext {
  input: Record<string, unknown>;
  messages: Message[];
  schema: Record<string, any>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
}

interface ValidationStep {
  name: string;
  execute: (context: ValidationContext) => ValidationResult;
}

class StructuredToolInputValidationPipelineV20 {
  private steps: ValidationStep[] = [];

  private constructor(initialSteps: ValidationStep[] = []) {
    this.steps = initialSteps;
  }

  public static build(initialSteps: ValidationStep[] = []): StructuredToolInputValidationPipelineV20 {
    return new StructuredToolInputValidationPipelineV20(initialSteps);
  }

  public addStep(step: ValidationStep): StructuredToolInputValidationPipelineV20 {
    this.steps.push(step);
    return this;
  }

  public validate(context: ValidationContext): ValidationResult {
    let currentResult: ValidationResult = {
      isValid: true,
      errors: [],
      context: { ...context.input },
    };

    for (const step of this.steps) {
      const stepResult = step.execute(context);
      currentResult.isValid = currentResult.isValid && stepResult.isValid;
      currentResult.errors = [...currentResult.errors, ...stepResult.errors];
      currentResult.context = { ...currentResult.context, ...stepResult.context };
    }

    return currentResult;
  }
}

class SchemaPresenceValidationStep implements ValidationStep {
  name = "SchemaPresenceValidation";

  execute(context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const input = context.input;

    if (typeof input !== 'object' || input === null) {
      errors.push("Input must be a non-null object.");
      return { isValid: false, errors, context: {} };
    }

    // Basic check: ensure all required fields defined in schema are present
    const requiredFields = Object.keys(context.schema).filter(key =>
      typeof context.schema[key] === 'object' && 'required' in context.schema[key] && context.schema[key]['required']
    );

    for (const field of requiredFields) {
      if (!(field in input) || input[field] === undefined || input[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return { isValid: errors.length === 0, errors, context: { ...context.input } };
  }
}

class CrossFieldDependencyValidationStep implements ValidationStep {
  name = "CrossFieldDependencyValidation";

  execute(context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const input = context.input;

    // Example dependency: If 'tool_name' is provided, 'tool_input' must also be provided.
    if (typeof input.tool_name === 'string' && input.tool_name.length > 0) {
      if (typeof input.tool_input === 'undefined' || input.tool_input === null) {
        errors.push("When 'tool_name' is specified, 'tool_input' must also be provided.");
      }
    }

    return { isValid: errors.length === 0, errors, context: { ...context.input } };
  }
}

class TemporalConstraintValidationStep implements ValidationStep {
  name = "TemporalConstraintValidation";

  execute(context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const input = context.input;

    // Example temporal check: 'start_time' must be before 'end_time'
    const startTime = input.start_time as Date | string;
    const endTime = input.end_time as Date | string;

    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (isNaN(start) || isNaN(end)) {
        errors.push("Invalid date format provided for start_time or end_time.");
      } else if (start >= end) {
        errors.push("start_time must be strictly before end_time.");
      }
    }

    return { isValid: errors.length === 0, errors, context: { ...context.input } };
  }
}

export {
  StructuredToolInputValidationPipelineV20,
  SchemaPresenceValidationStep,
  CrossFieldDependencyValidationStep,
  TemporalConstraintValidationStep
};