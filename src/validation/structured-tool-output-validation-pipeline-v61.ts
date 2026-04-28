import {
  ToolResultMessage,
  Message,
} from "./types";

interface ValidationContext {
  data: Record<string, unknown>;
  history: Message[];
}

type ValidatorStep<T> = (context: ValidationContext, data: T) => {
  isValid: boolean;
  errors: string[];
  correctedData?: T;
};

interface StructuredValidatorStep<T> {
  validate: (context: ValidationContext, data: T) => {
    isValid: boolean;
    errors: string[];
    correctedData?: T;
  };
}

class StructuredToolOutputValidatorPipeline {
  private steps: StructuredValidatorStep<any>[] = [];

  addStep(step: StructuredValidatorStep<any>): void {
    this.steps.push(step);
  }

  validate(context: ValidationContext, data: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    correctedData: Record<string, unknown>;
  } {
    let currentData: Record<string, unknown> = { ...data };
    let allErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.validate(context, currentData);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
      if (result.correctedData !== undefined) {
        currentData = result.correctedData;
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      correctedData: currentData,
    };
  }
}

class TemporalValidatorStep implements StructuredValidatorStep<Record<string, unknown>> {
  validate(context: ValidationContext, data: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
    correctedData?: Record<string, unknown>;
  } {
    const errors: string[] = [];
    let correctedData: Record<string, unknown> = { ...data };

    const checkTemporalConsistency = (fieldName: string, value: unknown) => {
      if (typeof value !== "number" || isNaN(value)) {
        return true;
      }
      const startTimeField = "start_time";
      const endTimeField = "end_time";

      if (fieldName === endTimeField) {
        const startTime = data[startTimeField];
        if (typeof startTime === "number" && startTime > 0) {
          if (value < startTime) {
            errors.push(`${endTimeField} (${value}) must be after or equal to ${startTimeField} (${startTime}).`);
            // Attempt to correct by setting end_time to max(end_time, start_time)
            correctedData[endTimeField] = Math.max(value, startTime);
          }
        }
      }
    };

    if (typeof data.start_time === "number" && typeof data.end_time === "number") {
      checkTemporalConsistency("end_time", data.end_time);
    } else {
      // Basic check for presence if required
      // errors.push("start_time and end_time must be present and numeric.");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      correctedData: correctedData,
    };
  }
}

export const createStructuredToolOutputValidationPipeline = (): StructuredToolOutputValidatorPipeline => {
  const pipeline = new StructuredToolOutputValidatorPipeline();

  // 1. Basic Schema Validation Step (Placeholder for JSON Schema validation)
  pipeline.addStep({
    validate: (context, data) => {
      const errors: string[] = [];
      let isValid = true;

      if (typeof data !== 'object' || data === null) {
        errors.push("Output must be a non-null object.");
        isValid = false;
      }

      // Example: Check for required fields
      if (!('tool_id' in data) || typeof data.tool_id !== 'string') {
        errors.push("Missing or invalid 'tool_id'.");
        isValid = false;
      }

      return {
        isValid: isValid && errors.length === 0,
        errors: errors,
        correctedData: data,
      };
    },
  });

  // 2. Temporal Consistency Step
  pipeline.addStep({
    validate: (context, data) => {
      return (context, data) => {
        const temporalValidator = new TemporalValidatorStep();
        return temporalValidator.validate(context, data);
      };
    },
  });

  // 3. Cross-Field Dependency Step (Example: Ensuring status matches outcome)
  pipeline.addStep({
    validate: (context, data) => {
      const errors: string[] = [];
      let correctedData: Record<string, unknown> = { ...data };

      const status = data.status as string | undefined;
      const outcome = data.outcome as string | undefined;

      if (status && outcome) {
        const validPairs: Record<string, string[]> = {
          "SUCCESS": ["COMPLETED", "SUCCESS"],
          "FAILURE": ["ERROR", "FAILED"],
          "PENDING": ["IN_PROGRESS", "PENDING"],
        };

        const allowedOutcomes = validPairs[status];
        if (allowedOutcomes && !allowedOutcomes.includes(outcome)) {
          errors.push(`Invalid combination: Status '${status}' cannot result in outcome '${outcome}'.`);
          // Correction: Defaulting outcome to a safe state if invalid
          correctedData = { ...data, outcome: "UNKNOWN" };
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
        correctedData: correctedData,
      };
    },
  });

  return pipeline;
};