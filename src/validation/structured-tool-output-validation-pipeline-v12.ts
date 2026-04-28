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

export interface StructuredToolOutputValidator {
  validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

export interface ValidationPipeline {
  addValidator(validator: StructuredToolOutputValidator): ValidationPipeline;
  run(output: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputValidationPipelineV12 implements ValidationPipeline {
  private validators: StructuredToolOutputValidator[] = [];

  addValidator(validator: StructuredToolOutputValidator): ValidationPipeline {
    this.validators.push(validator);
    return this;
  }

  run(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];
    for (const validator of this.validators) {
      const result = validator.validate(output);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

export class TemporalConstraintValidator implements StructuredToolOutputValidator {
  validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields: (keyof typeof output)[] = ["startTime", "endTime", "predecessorId"];

    for (const field of requiredFields) {
      if (!(field in output) || output[field] === undefined || output[field] === null) {
        errors.push(`Missing required temporal field: ${String(field)}.`);
      }
    }

    if (typeof output.startTime !== 'number' || typeof output.endTime !== 'number') {
      errors.push("Temporal fields must be numbers (timestamps).");
    }

    if (typeof output.startTime === 'number' && typeof output.endTime === 'number' && output.startTime > output.endTime) {
      errors.push("startTime cannot be greater than endTime.");
    }

    return { isValid: errors.length === 0, errors };
  }
}

export class CrossFieldDependencyValidator implements StructuredToolOutputValidator {
  validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { resultId, inputData, status } = output;

    if (typeof resultId !== 'string' || resultId.length < 5) {
      errors.push("resultId must be a non-empty string.");
    }

    if (typeof inputData !== 'object' || inputData === null) {
      errors.push("inputData must be a valid object.");
    } else {
      const requiredInputKeys: (keyof typeof inputData)[] = ["userId", "contextVersion"];
      for (const key of requiredInputKeys) {
        if (!(key in inputData) || inputData[key] === undefined) {
          errors.push(`inputData is missing required key: ${String(key)}.`);
        }
      }
    }

    if (status && !['SUCCESS', 'FAILURE', 'PENDING'].includes(status as string)) {
      errors.push(`Status must be one of: SUCCESS, FAILURE, PENDING. Found: ${String(status)}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

export const createStructuredToolOutputValidationPipelineV12 = (): ValidationPipeline => {
  const pipeline = new StructuredToolOutputValidationPipelineV12();

  pipeline.addValidator(new TemporalConstraintValidator());
  pipeline.addValidator(new CrossFieldDependencyValidator());

  return pipeline;
};