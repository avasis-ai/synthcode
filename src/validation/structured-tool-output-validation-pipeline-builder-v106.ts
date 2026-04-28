import { Message } from "./message-types";

interface ValidationStep {
  validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

class BaseValidationBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): { validate: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] } } {
    return {
      validate: (output: Record<string, unknown>) => {
        let allErrors: string[] = [];
        let isValid = true;

        for (const step of this.steps) {
          const result = step.validate(output);
          if (!result.isValid) {
            isValid = false;
            allErrors = [...allErrors, ...result.errors];
          }
        }

        return { isValid, errors: allErrors };
      },
    };
  }
}

class StructuredToolOutputValidationPipelineBuilderV106 extends BaseValidationBuilder {
  addSchemaValidator(schema: Record<string, any>): this {
    return this.addStep({
      validate: (output) => {
        // Placeholder for actual JSON schema validation logic
        const errors: string[] = [];
        let isValid = true;
        // Simplified check: assume schema validation passes if keys exist
        for (const key in schema) {
          if (!(key in output)) {
            errors.push(`Missing required field: ${key}`);
            isValid = false;
          }
        }
        return { isValid, errors };
      },
    });
  }

  addTemporalValidator(fieldName: string, sequenceKey: string): this {
    return this.addStep({
      validate: (output) => {
        // Placeholder for temporal consistency check (e.g., start_date < end_date)
        const errors: string[] = [];
        let isValid = true;
        if (typeof output[fieldName] === 'object' && output[fieldName] !== null) {
          // Simulate checking two related fields
          const start = output[fieldName].start;
          const end = output[fieldName].end;
          if (start && end && new Date(start) >= new Date(end)) {
            errors.push(`Temporal inconsistency: Start date (${start}) must be before end date (${end}).`);
            isValid = false;
          }
        }
        return { isValid, errors };
      },
    });
  }

  addCrossFieldValidator(fieldA: string, fieldB: string, condition: (a: any, b: any) => boolean): this {
    return this.addStep({
      validate: (output) => {
        // Placeholder for complex cross-field logic
        const errors: string[] = [];
        let isValid = true;
        const valA = output[fieldA];
        const valB = output[fieldB];

        if (valA !== undefined && valB !== undefined) {
          if (!condition(valA, valB)) {
            errors.push(`Cross-field validation failed: ${fieldA} (${valA}) and ${fieldB} (${valB}) do not satisfy the required condition.`);
            isValid = false;
          }
        }
        return { isValid, errors };
      },
    });
  }

  build(): { validate: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] } } {
    return super.build();
  }
}

export { StructuredToolOutputValidationPipelineBuilderV106 };