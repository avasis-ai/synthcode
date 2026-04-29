import { Message, ToolResultMessage } from "./types";

type ValidatorFn = (data: Record<string, unknown>) => { isValid: boolean; errors: string[] };

interface ValidationStep {
  execute: (data: Record<string, unknown>) => { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];

  private addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public addRequiredFieldValidator(fieldName: string): this {
    return this.addStep({
      execute: (data) => {
        const value = data[fieldName];
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          return { isValid: false, errors: [`Field '${fieldName}' is required.`] };
        }
        return { isValid: true, errors: [] };
      },
    });
  }

  public addTypeValidator<T>(fieldName: string, expectedType: new (...args: any[]) => T): this {
    return this.addStep({
      execute: (data) => {
        const value = data[fieldName];
        if (value === undefined || value === null) {
          return { isValid: true, errors: [] }; // Handled by required check if needed
        }
        if (!(value instanceof expectedType) && typeof value !== 'object' && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
          return { isValid: false, errors: [`Field '${fieldName}' must be of type ${expectedType.name || 'unknown'}.`] };
        }
        return { isValid: true, errors: [] };
      },
    });
  }

  public addCrossFieldValidator(
    condition: (data: Record<string, unknown>) => boolean,
    errorMessage: string
  ): this {
    return this.addStep({
      execute: (data) => {
        if (condition(data)) {
          return { isValid: true, errors: [] };
        }
        return { isValid: false, errors: [errorMessage] };
      },
    });
  }

  public buildPipeline(): {
    validate: (data: Record<string, unknown>) => { isValid: boolean; errors: string[] };
  } {
    const validate = (data: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
      const allErrors: string[] = [];
      let overallValid = true;

      for (const step of this.steps) {
        const result = step.execute(data);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          overallValid = false;
        }
      }

      return { isValid: overallValid, errors: allErrors };
    };

    return { validate };
  }
}