import { Message } from "./message-types";

type ValidatorFunction = (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };

interface SchemaValidator {
  validateSchema: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
}

interface CrossFieldValidator {
  validateCrossField: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
}

interface TemporalValidator {
  validateTemporal: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
}

type ValidationPipeline = {
  validators: {
    schema: SchemaValidator;
    crossField: CrossFieldValidator;
    temporal: TemporalValidator;
  };
  execute: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
};

export class StructuredToolOutputValidationPipelineBuilderV111 {
  private schemaValidator: SchemaValidator | null = null;
  private crossFieldValidator: CrossFieldValidator | null = null;
  private temporalValidator: TemporalValidator | null = null;

  constructor() {}

  addSchemaValidator(validator: SchemaValidator): this {
    this.schemaValidator = validator;
    return this;
  }

  addCrossFieldValidator(validator: CrossFieldValidator): this {
    this.crossFieldValidator = validator;
    return this;
  }

  addTemporalValidator(validator: TemporalValidator): this {
    this.temporalValidator = validator;
    return this;
  }

  build(): ValidationPipeline {
    if (!this.schemaValidator) {
      throw new Error("Schema validator must be added first.");
    }

    const pipeline: ValidationPipeline = {
      validators: {
        schema: this.schemaValidator!,
        crossField: this.crossFieldValidator!,
        temporal: this.temporalValidator!,
      },
      execute: (output: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
        let allErrors: string[] = [];
        let isValid = true;

        const runValidator = (validator: any, name: string) => {
          const result = validator.validateSchema ? validator.validateSchema(output) :
                          validator.validateCrossField ? validator.validateCrossField(output) :
                          validator.validateTemporal(output);

          if (!result.isValid) {
            isValid = false;
            allErrors.push(...result.errors);
          }
        };

        // Execution order: Schema -> CrossField -> Temporal
        runValidator(this.schemaValidator, "Schema");
        runValidator(this.crossFieldValidator, "CrossField");
        runValidator(this.temporalValidator, "Temporal");

        return {
          isValid: isValid,
          errors: allErrors,
        };
      },
    };

    return pipeline;
  }
}