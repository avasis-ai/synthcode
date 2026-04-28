import {
  StructuredToolOutputValidator,
  ValidationStep,
  ValidationResult,
} from "./structured-tool-output-validation-pipeline-v27";

export class StructuredToolOutputValidator {
  private readonly schemaValidator: StructuredToolOutputValidator;
  private readonly temporalValidator: TemporalConsistencyValidator;

  constructor(
    schemaValidator: StructuredToolOutputValidator,
    temporalValidator: TemporalConsistencyValidator
  ) {
    this.schemaValidator = schemaValidator;
    this.temporalValidator = temporalValidator;
  }

  public validate(
    output: Record<string, unknown>,
    schemaVersion: string,
    context: Record<string, unknown> = {}
  ): ValidationResult {
    const schemaValidationResult = this.schemaValidator.validate(
      output,
      schemaVersion
    );

    if (!schemaValidationResult.isValid) {
      return {
        isValid: false,
        errors: [
          {
            step: "SchemaValidation",
            message: `Schema validation failed for version ${schemaVersion}: ${schemaValidationResult.errors.map(e => e.message).join(", ")}`,
          },
        ],
      };
    }

    const temporalValidationResult = this.temporalValidator.validate(
      output,
      context
    );

    if (!temporalValidationResult.isValid) {
      return {
        isValid: false,
        errors: [
          {
            step: "TemporalConsistencyValidation",
            message: `Temporal consistency check failed: ${temporalValidationResult.errors.map(e => e).join("; ")}`,
          },
        ],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }
}

export class TemporalConsistencyValidator implements ValidationStep {
  public validate(
    output: Record<string, unknown>,
    context: Record<string, unknown>
  ): ValidationResult {
    const errors: string[] = [];

    if (typeof output.timestamps !== "object" || output.timestamps === null) {
      errors.push("Output must contain a 'timestamps' object for temporal validation.");
      return { isValid: false, errors: errors };
    }

    const timestamps = output.timestamps as {
      startTime: string;
      endTime: string;
      intermediateSteps: Array<{ timestamp: string; action: string }>;
    };

    try {
      const start = new Date(timestamps.startTime);
      const end = new Date(timestamps.endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        errors.push("Invalid date format in startTime or endTime.");
        return { isValid: false, errors: errors };
      }

      if (start.getTime() > end.getTime()) {
        errors.push("Start time cannot be after end time.");
      }

      const sortedSteps = timestamps.intermediateSteps.sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      for (let i = 0; i < sortedSteps.length - 1; i++) {
        const current = sortedSteps[i];
        const next = sortedSteps[i + 1];

        const currentTime = new Date(current.timestamp).getTime();
        const nextTime = new Date(next.timestamp).getTime();

        if (nextTime < currentTime) {
          errors.push(`Time sequence error: Step '${next.action}' at ${next.timestamp} occurred before step '${current.action}' at ${current.timestamp}.`);
        }
      }
    } catch (e) {
      errors.push(`Error during temporal validation: ${(e as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}