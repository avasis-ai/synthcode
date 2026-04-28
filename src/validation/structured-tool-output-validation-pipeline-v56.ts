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

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

interface ValidatorStep {
  validate: (output: Record<string, unknown>) => ValidationResult;
}

class StructuredToolOutputValidator {
  private steps: ValidatorStep[] = [];

  private constructor() {}

  static getInstance(): StructuredToolOutputValidator {
    if (!StructuredToolOutputValidator.instance) {
      StructuredToolOutputValidator.instance = new StructuredToolOutputValidator();
    }
    return StructuredToolOutputValidator.instance;
  }

  public addStep(step: ValidatorStep): void {
    this.steps.push(step);
  }

  public validate(output: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
  } {
    const allErrors: string[] = [];
    for (const step of this.steps) {
      const result = step.validate(output);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  public static get instance(): StructuredToolOutputValidator {
    if (!StructuredToolOutputValidator.instance) {
      StructuredToolOutputValidator.instance = new StructuredToolOutputValidator();
    }
    return StructuredToolOutputValidator.instance;
  }
}

class CrossFieldDependencyValidator implements ValidatorStep {
  validate(output: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const requiredFieldA = "requiredFieldA";
    const requiredFieldB = "requiredFieldB";

    if (typeof output[requiredFieldA] !== "string" || !output[requiredFieldA].includes("A")) {
      errors.push(`CrossFieldDependencyValidator: Field ${requiredFieldA} must be a string containing "A".`);
    }
    if (typeof output[requiredFieldB] !== "number" || output[requiredFieldB] < 0) {
      errors.push(`CrossFieldDependencyValidator: Field ${requiredFieldB} must be a non-negative number.`);
    }
    if (typeof output[requiredFieldA] === "string" && typeof output[requiredFieldB] === "number" && output[requiredFieldA].length > 10 && output[requiredFieldB] > 100) {
      // Example of a complex dependency check
    }

    return { isValid: errors.length === 0, errors };
  }
}

class TemporalConsistencyValidator implements ValidatorStep {
  validate(output: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const timestampField = "timestamp";

    if (typeof output[timestampField] !== "number") {
      errors.push(`TemporalConsistencyValidator: Field ${timestampField} is missing or not a number.`);
    } else {
      const currentTime = Date.now();
      if (output[timestampField] > currentTime + 1000) {
        errors.push(`TemporalConsistencyValidator: Timestamp ${output[timestampField]} is in the future.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

class SchemaEvolutionValidator implements ValidatorStep {
  private readonly expectedSchema: Record<string, any> = {
    id: "string",
    data: "object",
    timestamp: "number",
  };

  validate(output: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const keys = Object.keys(output);

    for (const key of keys) {
      const value = output[key];
      const expectedType = this.expectedSchema[key];

      if (!expectedType) {
        errors.push(`SchemaEvolutionValidator: Unknown field found: ${key}. Schema drift detected.`);
      } else {
        const actualType = typeof value;
        if (expectedType === "string" && actualType !== "string") {
          errors.push(`SchemaEvolutionValidator: Field ${key} expected type 'string' but got '${actualType}'.`);
        } else if (expectedType === "number" && actualType !== "number") {
          errors.push(`SchemaEvolutionValidator: Field ${key} expected type 'number' but got '${actualType}'.`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

export {StructuredToolOutputValidator, CrossFieldDependencyValidator, TemporalConsistencyValidator, SchemaEvolutionValidator};