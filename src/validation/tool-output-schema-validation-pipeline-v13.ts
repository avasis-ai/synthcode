import {
  ToolOutputSchemaValidator,
  ValidationStep,
  ValidationResult,
} from "./tool-output-schema-validation-pipeline-v12";

export type ToolOutputSchema = Record<string, any>;

interface TemporalConstraint {
  fieldA: string;
  fieldB: string;
  validator: (a: any, b: any) => boolean;
  errorMessage: string;
}

type TemporalValidator = (output: Record<string, any>) => ValidationResult;

class TemporalConstraintValidator implements ValidationStep {
  private constraints: TemporalConstraint[];

  constructor(constraints: TemporalConstraint[]) {
    this.constraints = constraints;
  }

  validate(output: Record<string, any>): ValidationResult {
    for (const constraint of this.constraints) {
      const valA = output[constraint.fieldA];
      const valB = output[constraint.fieldB];

      if (valA !== undefined && valB !== undefined) {
        if (!constraint.validator(valA, valB)) {
          return {
            isValid: false,
            errors: [{
              field: "temporal_constraint",
              message: constraint.errorMessage,
              details: {
                fieldA: constraint.fieldA,
                fieldB: constraint.fieldB,
              },
            }],
          };
        }
      }
    }
    return { isValid: true, errors: [] };
  }
}

export class ToolOutputSchemaValidatorV13 extends ToolOutputSchemaValidator {
  private temporalValidator: TemporalValidator;

  constructor(
    private schema: ToolOutputSchema,
    temporalConstraints: TemporalConstraint[] = [],
  ) {
    super(schema);
    this.temporalValidator = this.createTemporalValidator(temporalConstraints);
  }

  private createTemporalValidator(constraints: TemporalConstraint[]): TemporalValidator {
    return (output: Record<string, any>): ValidationResult => {
      const temporalValidator = new TemporalConstraintValidator(constraints);
      return temporalValidator.validate(output);
    };
  }

  public async validate(output: Record<string, any>): Promise<ValidationResult> {
    let result: ValidationResult = await super.validate(output);

    if (!result.isValid) {
      return result;
    }

    const temporalResult = this.temporalValidator(output);

    if (!temporalResult.isValid) {
      return {
        isValid: false,
        errors: [...result.errors, ...(temporalResult.errors || [])],
      };
    }

    return { isValid: true, errors: [] };
  }
}