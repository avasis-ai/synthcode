import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
}

export interface StructuredToolOutputValidator {
  validate(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult;
  validateTemporalConsistency(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult;
}

export class CrossFieldDependencyValidator implements StructuredToolOutputValidator {
  validate(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    if (typeof output.required_field_a !== 'string' || output.required_field_a.length < 5) {
      errors.push("Field A must be a string of at least 5 characters.");
    }
    if (typeof output.required_field_b !== 'number' || output.required_field_b < 0) {
      errors.push("Field B must be a non-negative number.");
    }
    return {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...context, fieldA: output.required_field_a, fieldB: output.required_field_b },
    };
  }

  validateTemporalConsistency(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const timestampA = output.timestamp_a as number;
    const timestampB = output.timestamp_b as number;

    if (typeof timestampA !== 'number' || typeof timestampB !== 'number') {
      errors.push("Both timestamp_a and timestamp_b must be numbers.");
      return { isValid: false, errors: errors, context: context };
    }

    if (timestampA > timestampB) {
      errors.push("Temporal inconsistency detected: timestamp_a cannot be after timestamp_b.");
    }
    return {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...context, timestampA, timestampB },
    };
  }
}

export class SchemaComplianceValidator implements StructuredToolOutputValidator {
  validate(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    if (!('id' in output) || typeof output.id !== 'string') {
      errors.push("Output must contain a string 'id'.");
    }
    if (!('status' in output) || typeof output.status !== 'string') {
      errors.push("Output must contain a string 'status'.");
    }
    return {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...context, id: output.id, status: output.status },
    };
  }

  validateTemporalConsistency(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    return { isValid: true, errors: [], context: context };
  }
}

export class StructuredToolOutputValidationPipelineBuilder {
  private validators: StructuredToolOutputValidator[] = [];

  addValidator(validator: StructuredToolOutputValidator): this {
    this.validators.push(validator);
    return this;
  }

  build(): StructuredToolOutputValidationPipelineExecutor {
    return new StructuredToolOutputValidationPipelineExecutor(this.validators);
  }
}

export class StructuredToolOutputValidationPipelineExecutor {
  private validators: StructuredToolOutputValidator[];

  constructor(validators: StructuredToolOutputValidator[]) {
    this.validators = validators;
  }

  execute(output: Record<string, unknown>, initialContext: Record<string, unknown> = {}): ValidationResult {
    let currentContext: Record<string, unknown> = { ...initialContext };
    const allErrors: string[] = [];
    let overallValid = true;

    for (const validator of this.validators) {
      // 1. Standard Validation
      const standardResult = validator.validate(output, currentContext);
      if (!standardResult.isValid) {
        allErrors.push(`[${validator.constructor.name} Standard] Failed: ${standardResult.errors.join('; ')}`);
        overallValid = false;
      }
      currentContext = { ...currentContext, ...standardResult.context };

      // 2. Temporal Consistency Validation
      const temporalResult = validator.validateTemporalConsistency(output, currentContext);
      if (!temporalResult.isValid) {
        allErrors.push(`[${validator.constructor.name} Temporal] Failed: ${temporalResult.errors.join('; ')}`);
        overallValid = false;
      }
      currentContext = { ...currentContext, ...temporalResult.context };
    }

    return {
      isValid: overallValid,
      errors: allErrors,
      context: currentContext,
    };
  }
}

export {
  StructuredToolOutputValidator,
  StructuredToolOutputValidationPipelineBuilder,
  StructuredToolOutputValidationPipelineExecutor,
  CrossFieldDependencyValidator,
  SchemaComplianceValidator,
};