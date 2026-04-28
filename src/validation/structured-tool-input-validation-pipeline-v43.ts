import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

interface ValidatorStep {
  validate(inputs: Record<string, unknown>): ValidationResult;
}

export interface TemporalDependencyValidator extends ValidatorStep {
  validate(inputs: Record<string, unknown>): ValidationResult;
}

export class StructuredToolInputValidationPipeline {
  private validators: ValidatorStep[] = [];

  private constructor() {}

  private static instance(): StructuredToolInputValidationPipeline {
    if (!StructuredToolInputValidationPipeline.instance) {
      StructuredToolInputValidationPipeline.instance = new StructuredToolInputValidationPipeline();
    }
    return StructuredToolInputValidationPipeline.instance;
  }

  public static getInstance(): StructuredToolInputValidationPipeline {
    return StructuredToolInputValidationPipeline.instance();
  }

  public addValidator(validator: ValidatorStep): StructuredToolInputValidationPipeline {
    this.validators.push(validator);
    return this;
  }

  public withTemporalDependencyValidator(validator: TemporalDependencyValidator): StructuredToolInputValidationPipeline {
    this.addValidator(validator);
    return this;
  }

  public validate(inputs: Record<string, unknown>): ValidationResult {
    let allErrors: string[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(inputs);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  private static instance: StructuredToolInputValidationPipeline;
}

export class BasicSchemaValidator implements ValidatorStep {
  private requiredFields: { [key: string]: boolean } = {};

  constructor(requiredFields: Record<string, boolean>) {
    this.requiredFields = requiredFields;
  }

  validate(inputs: Record<string, unknown>): ValidationResult {
    let errors: string[] = [];
    for (const field in this.requiredFields) {
      if (this.requiredFields[field] && !(field in inputs) || inputs[field] === null || inputs[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

export class TemporalDependencyValidatorImpl implements TemporalDependencyValidator {
  validate(inputs: Record<string, unknown>): ValidationResult {
    const startTime = inputs["start_time"] as string | undefined;
    const endTime = inputs["end_time"] as string | undefined;
    let errors: string[] = [];

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        errors.push("Invalid date format provided for start_time or end_time.");
      } else if (start >= end) {
        errors.push("Temporal inconsistency: start_time must strictly precede end_time.");
      }
    } else if (!startTime && !endTime) {
        // Optionally, you could enforce that both must be present if the tool requires time ranges
    }

    return { isValid: errors.length === 0, errors };
  }
}