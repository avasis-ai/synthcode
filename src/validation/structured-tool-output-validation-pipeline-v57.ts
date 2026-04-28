import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationContext {
  messages: Message[];
  // Add any other context needed for advanced validation, e.g., session history, current time
}

export interface StructuredToolOutputValidator {
  validate(
    output: Record<string, unknown>,
    context: ValidationContext
  ): { isValid: boolean; errors: string[] };
}

export interface TemporalValidator {
  validate(
    output: Record<string, unknown>,
    context: ValidationContext
  ): { isValid: boolean; errors: string[] };
}

export class TemporalConsistencyValidator implements TemporalValidator {
  validate(
    output: Record<string, unknown>,
    context: ValidationContext
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const currentTime = new Date();

    if (typeof output.timestamp !== 'number' && typeof output.timestamp !== 'string') {
      errors.push("Output must contain a 'timestamp' field.");
    } else {
      const outputTime = new Date(output.timestamp);
      if (isNaN(outputTime.getTime())) {
        errors.push("Invalid timestamp format in output.");
      } else {
        // Basic check: Ensure output time is not wildly in the future/past relative to context
        const timeDifferenceMs = Math.abs(outputTime.getTime() - currentTime.getTime());
        if (timeDifferenceMs > 3600000 * 24 * 365) { // More than a year difference
          errors.push("Timestamp appears to be significantly outside the expected temporal window.");
        }
      }
    }

    // Example: Check for sequential dependency (assuming 'step_id' exists and must increment)
    if (typeof output.step_id === 'number' && context.messages.length > 0) {
      const lastStepId = context.messages[context.messages.length - 1]?.step_id || 0;
      if (output.step_id <= lastStepId) {
        errors.push(`Step ID ${output.step_id} must be greater than the last recorded step ID ${lastStepId}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export class StructuredToolOutputValidatorImpl implements StructuredToolOutputValidator {
  validate(
    output: Record<string, unknown>,
    context: ValidationContext
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof output.tool_name !== 'string' || !output.tool_name) {
      errors.push("Missing or invalid 'tool_name'.");
    }

    if (typeof output.arguments === 'undefined') {
      errors.push("Missing 'arguments' field.");
    } else if (typeof output.arguments !== 'object' || output.arguments === null) {
      errors.push("'arguments' must be a valid JSON object.");
    }

    // Cross-field dependency check example: If tool_name is 'calculator', arguments must have 'a' and 'b'
    if (output.tool_name === "calculator" && (typeof output.arguments !== 'object' || !('a' in output.arguments) || !('b' in output.arguments))) {
      errors.push("When tool_name is 'calculator', 'arguments' must contain both 'a' and 'b'.");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export class StructuredToolOutputValidationPipelineBuilder {
  private validators: StructuredToolOutputValidator[] = [];
  private temporalValidators: TemporalValidator[] = [];

  private constructor() {}

  private static instance(): StructuredToolOutputValidationPipelineBuilder {
    if (!StructuredToolOutputValidationPipelineBuilder.instance) {
      StructuredToolOutputValidationPipelineBuilder.instance = new StructuredToolOutputValidationPipelineBuilder();
    }
    return StructuredToolOutputValidationPipelineBuilder.instance;
  }

  public static getInstance(): StructuredToolOutputValidationPipelineBuilder {
    return StructuredToolOutputValidationPipelineBuilder.instance;
  }

  public addStructuredValidator(validator: StructuredToolOutputValidator): this {
    this.validators.push(validator);
    return this;
  }

  public addTemporalValidator(validator: TemporalValidator): this {
    this.temporalValidators.push(validator);
    return this;
  }

  public build(): ValidationPipeline {
    return new ValidationPipeline(this.validators, this.temporalValidators);
  }
}

export class ValidationPipeline {
  private structuredValidators: StructuredToolOutputValidator[];
  private temporalValidators: TemporalValidator[];

  constructor(
    structuredValidators: StructuredToolOutputValidator[],
    temporalValidators: TemporalValidator[]
  ) {
    this.structuredValidators = structuredValidators;
    this.temporalValidators = temporalValidators;
  }

  public validate(
    output: Record<string, unknown>,
    context: ValidationContext
  ): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    // 1. Run Structured Validators
    for (const validator of this.structuredValidators) {
      const result = validator.validate(output, context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }

    // 2. Run Temporal Validators
    for (const validator of this.temporalValidators) {
      const result = validator.validate(output, context);
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

export const buildPipeline = (): ValidationPipeline => {
  const builder = StructuredToolOutputValidationPipelineBuilder.getInstance();

  // Ensure backward compatibility by adding core validators
  builder.addStructuredValidator(new StructuredToolOutputValidatorImpl());

  // Add advanced/new validators
  builder.addTemporalValidator(new TemporalConsistencyValidator());

  return builder.build();
};