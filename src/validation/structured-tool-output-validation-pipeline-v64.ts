import { Message, ContentBlock, ToolResultMessage } from "./types";

interface ValidationContext {
  inputOutput: Record<string, unknown>;
  history: Message[];
}

interface ValidationStep {
  execute: (context: ValidationContext) => {
    isValid: boolean;
    output: Record<string, unknown>;
    error?: string;
  };
}

abstract class BaseValidationStep implements ValidationStep {
  abstract execute(context: ValidationContext): {
    isValid: boolean;
    output: Record<string, unknown>;
    error?: string;
  };
}

class TemporalConsistencyStep extends BaseValidationStep {
  private readonly fieldName: keyof ValidationContext['inputOutput'];
  constructor(fieldName: keyof ValidationContext['inputOutput']) {
    super();
    this.fieldName = fieldName;
  }

  execute(context: ValidationContext): {
    isValid: boolean;
    output: Record<string, unknown>;
    error?: string;
  } {
    const value = context.inputOutput[this.fieldName];
    if (typeof value !== 'object' || value === null) {
      return { isValid: true, output: { temporalCheckPassed: true } };
    }

    // Simplified temporal check logic: assumes value has a 'timestamp' property
    if (typeof value.timestamp !== 'number') {
      return { isValid: false, output: {}, error: `Temporal check failed: Missing or invalid timestamp for ${String(this.fieldName)}.` };
    }

    const currentTime = Date.now();
    const timeDifference = Math.abs(currentTime - value.timestamp);

    const isValid = timeDifference < (3600 * 1000 * 24); // Within 24 hours
    return {
      isValid: isValid,
      output: { temporalCheckPassed: true, timeDifference: timeDifference },
      error: isValid ? undefined : `Temporal check failed: Time difference (${timeDifference}ms) exceeds 24 hours.`
    };
  }
}

class CrossFieldDependencyStep extends BaseValidationStep {
  private readonly dependency: {
    fieldA: keyof ValidationContext['inputOutput'];
    fieldB: keyof ValidationContext['inputOutput'];
    condition: (a: unknown, b: unknown) => boolean;
  };

  constructor(dependency: {
    fieldA: keyof ValidationContext['inputOutput'];
    fieldB: keyof ValidationContext['inputOutput'];
    condition: (a: unknown, b: unknown) => boolean;
  }) {
    super();
    this.dependency = dependency;
  }

  execute(context: ValidationContext): {
    isValid: boolean;
    output: Record<string, unknown>;
    error?: string;
  } {
    const valueA = context.inputOutput[this.dependency.fieldA];
    const valueB = context.inputOutput[this.dependency.fieldB];

    const isValid = this.dependency.condition(valueA, valueB);

    return {
      isValid: isValid,
      output: { dependencyCheckPassed: true },
      error: isValid ? undefined : `Cross-field dependency failed: ${String(this.dependency.fieldA)} and ${String(this.dependency.fieldB)} do not meet the required condition.`
    };
  }
}

class StructuredToolOutputValidationPipeline {
  private readonly steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  run(context: ValidationContext): {
    isValid: boolean;
    finalOutput: Record<string, unknown>;
    error?: string;
  } {
    let currentContext: ValidationContext = {
      inputOutput: { ...context.inputOutput },
      history: context.history,
    };
    let overallValid = true;
    let finalOutput: Record<string, unknown> = {};

    for (const step of this.steps) {
      const result = step.execute(currentContext);
      
      if (!result.isValid) {
        overallValid = false;
        // Stop on first critical failure for simplicity, or continue to gather all errors
        return { isValid: false, finalOutput: { validationErrors: [result.error] }, error: result.error };
      }

      // Merge output from the step into the context/final output
      Object.assign(finalOutput, result.output);
    }

    return { isValid: overallValid, finalOutput: finalOutput, error: undefined };
  }
}

export function buildValidationPipeline(steps: ValidationStep[]): StructuredToolOutputValidationPipeline {
  return new StructuredToolOutputValidationPipeline(steps);
}