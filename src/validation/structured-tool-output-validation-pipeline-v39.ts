import {
  Schema,
  ValidationStep,
  ValidationResult,
  StructuredToolOutput,
} from "./structured-tool-output-validation-pipeline-v38";

export class StructuredToolOutputValidator {
  private schema: Schema;
  private validationSteps: ValidationStep<StructuredToolOutput>[];

  constructor(schema: Schema, validationSteps: ValidationStep<StructuredToolOutput>[]) {
    this.schema = schema;
    this.validationSteps = validationSteps;
  }

  public validate(output: StructuredToolOutput): ValidationResult {
    let currentResult: ValidationResult = {
      isValid: true,
      errors: [] as string[],
      data: output,
    };

    for (const step of this.validationSteps) {
      const stepResult = step.execute(output);
      if (!stepResult.isValid) {
        currentResult.isValid = false;
        currentResult.errors.push(...stepResult.errors);
      }
    }

    // Schema validation is typically the final check or the primary one
    const schemaResult = this.schema.validate(output);
    if (!schemaResult.isValid) {
      currentResult.isValid = false;
      currentResult.errors.push(...schemaResult.errors);
    }

    return {
      isValid: currentResult.isValid,
      errors: currentResult.errors,
      data: output,
    };
  }
}

export function buildStructuredToolOutputValidationPipeline(
  schema: Schema,
  crossFieldValidator: ValidationStep<StructuredToolOutput>,
  temporalValidator: ValidationStep<StructuredToolOutput>,
): StructuredToolOutputValidator {
  const steps: ValidationStep<StructuredToolOutput>[] = [
    crossFieldValidator,
    temporalValidator,
    new SchemaEvolutionValidator(),
  ];

  return new StructuredToolOutputValidator(schema, steps);
}

class SchemaEvolutionValidator implements ValidationStep<StructuredToolOutput> {
  execute(output: StructuredToolOutput): ValidationResult {
    // Placeholder for schema evolution validation logic
    // This step ensures the output structure matches expected evolution patterns.
    const isValid = output.tool_use_id && typeof output.tool_use_id === 'string';
    return {
      isValid: isValid,
      errors: isValid ? [] : ["Schema evolution validation failed: Missing or invalid tool_use_id."],
      data: output,
    };
  }
}

export {
  StructuredToolOutputValidator,
  buildStructuredToolOutputValidationPipeline,
  SchemaEvolutionValidator,
}