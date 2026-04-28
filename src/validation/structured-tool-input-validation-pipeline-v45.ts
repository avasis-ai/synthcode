import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ValidatorStep = (inputs: Record<string, unknown>) => {
  isValid: boolean;
  errors: string[];
};

interface SchemaDefinition {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object";
    required?: boolean;
    schema?: Record<string, any>;
    validators?: {
      type: "regex" | "minLength" | "maxLength";
      value?: string | number;
    }[];
    temporal?: {
      field: string;
      comparator: (a: unknown, b: unknown) => boolean;
      message: string;
      dependsOn: string;
    }[];
  };
}

class StructuredToolInputValidationPipeline {
  private schema: SchemaDefinition;
  private steps: ValidatorStep[] = [];

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  private buildBasicValidators(): ValidatorStep[] {
    const validators: ValidatorStep[] = [];

    const buildFieldValidator = (fieldName: string, definition: SchemaDefinition[typeof fieldName]): ValidatorStep => {
      return (inputs) => {
        const value = inputs[fieldName];
        const errors: string[] = [];

        if (definition.required && (value === undefined || value === null || value === "")) {
          errors.push(`${fieldName} is required.`);
        } else if (value !== undefined && value !== null && value !== "") {
          if (definition.type === "string") {
            if (definition.validators) {
              for (const validator of definition.validators) {
                if (validator.type === "regex" && typeof value === "string") {
                  const regex = new RegExp(validator.value as string);
                  if (!regex.test(value)) {
                    errors.push(`${fieldName} must match regex pattern.`);
                  }
                } else if (validator.type === "minLength" && typeof value === "string") {
                  if (value.length < validator.value as number) {
                    errors.push(`${fieldName} must be at least ${validator.value} characters long.`);
                  }
                } else if (validator.type === "maxLength" && typeof value === "string") {
                  if (value.length > validator.value as number) {
                    errors.push(`${fieldName} must be at most ${validator.value} characters long.`);
                  }
                }
              }
            }
          }
        }
        return { isValid: errors.length === 0, errors };
      };
    };

    const fieldValidators: ValidatorStep[] = [];
    for (const key in this.schema) {
      const definition = this.schema[key];
      if (definition) {
        fieldValidators.push(buildFieldValidator(key, definition));
      }
    }
    return fieldValidators;
  }

  private buildTemporalValidator(): ValidatorStep {
    const temporalChecks: {
      field: string;
      comparator: (a: unknown, b: unknown) => boolean;
      message: string;
      dependsOn: string;
    }[] = [];

    for (const key in this.schema) {
      const definition = this.schema[key];
      if (definition.temporal && Array.isArray(definition.temporal)) {
        for (const check of definition.temporal) {
          temporalChecks.push({
            field: check.field,
            comparator: check.comparator,
            message: check.message,
            dependsOn: check.dependsOn,
          });
        }
      }
    }

    return (inputs) => {
      const errors: string[] = [];
      for (const check of temporalChecks) {
        const valA = inputs[check.field];
        const valB = inputs[check.dependsOn];

        if (valA !== undefined && valB !== undefined) {
          if (!check.comparator(valA, valB)) {
            errors.push(`${check.message} (Checking ${check.field} against ${check.dependsOn})`);
          }
        }
      }
      return { isValid: errors.length === 0, errors };
    };
  }

  public addStep(validator: ValidatorStep): StructuredToolInputValidationPipeline {
    this.steps.push(validator);
    return this;
  }

  public build(): StructuredToolInputValidationPipeline {
    // 1. Add basic field validators
    const fieldValidators = this.buildBasicValidators();
    fieldValidators.forEach(validator => this.addStep(validator));

    // 2. Conditionally add temporal validator if any temporal checks exist
    const hasTemporalChecks = Object.values(this.schema).some(
      (def) => (def as any).temporal && Array.isArray((def as any).temporal)
    );

    if (hasTemporalChecks) {
      const temporalValidator = this.buildTemporalValidator();
      this.addStep(temporalValidator);
    }

    return this;
  }

  public validate(inputs: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step(inputs);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
        overallValid = false;
      }
    }

    return { isValid: overallValid, errors: allErrors };
  }
}

export { StructuredToolInputValidationPipeline };