import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface Schema {
  [key: string]: any;
}

type ValidatorStep = {
  type: string;
  validator: (data: Record<string, unknown>) => {
    isValid: boolean;
    message?: string;
  };
};

export class StructuredToolOutputValidationChainBuilder {
  private targetSchema: Schema;
  private validationSteps: ValidatorStep[] = [];

  constructor(targetSchema: Schema) {
    this.targetSchema = targetSchema;
  }

  addRequiredFieldValidator(fieldName: string): this {
    const validator: (data: Record<string, unknown>) => {
      return {
        isValid: typeof data[fieldName] !== "undefined" && data[fieldName] !== null,
        message: `Field '${fieldName}' is required.`,
      };
    };
    this.validationSteps.push({
      type: "requiredField",
      validator: validator,
    });
    return this;
  }

  addCrossFieldValidator(
    fieldNameA: string,
    fieldNameB: string,
    condition: (a: unknown, b: unknown) => boolean,
    errorMessage: string
  ): this {
    const validator: (data: Record<string, unknown>) => {
      const valA = data[fieldNameA];
      const valB = data[fieldNameB];
      if (condition(valA, valB)) {
        return { isValid: true };
      }
      return { isValid: false, message: errorMessage };
    };
    this.validationSteps.push({
      type: "crossField",
      validator: validator,
    });
    return this;
  }

  addTemporalConstraintValidator(
    fieldName: string,
    comparisonFn: (current: unknown, previous: unknown) => boolean,
    errorMessage: string
  ): this {
    const validator: (data: Record<string, unknown>) => {
      const currentValue = data[fieldName];
      // In a real scenario, 'data' would need context (e.g., previous state)
      // For this builder pattern simulation, we assume context is available or passed implicitly.
      // Since we only have 'data', we'll simulate checking against a known 'previous' value if possible.
      // For simplicity in this isolated builder, we'll assume the context check is external or simplified.
      // A robust implementation would require the executor to pass context.
      // Here, we'll just check if the value is present, acknowledging the limitation.
      if (typeof currentValue === 'object' && currentValue !== null && 'previous' in data) {
        const previousValue = data.previous as unknown;
        if (comparisonFn(currentValue, previousValue)) {
          return { isValid: true };
        }
        return { isValid: false, message: errorMessage };
      }
      return { isValid: true }; // Cannot validate temporal constraint without context
    };
    this.validationSteps.push({
      type: "temporalConstraint",
      validator: validator,
    });
    return this;
  }

  build(): {
    validate: (data: Record<string, unknown>) => {
      let firstError: { message: string } | undefined = undefined;
      const errors: { message: string }[] = [];

      const executeValidator = (validator: (data: Record<string, unknown>) => {
        isValid: boolean;
        message?: string;
      }) => {
        const result = validator(data);
        if (!result.isValid) {
          if (!firstError) {
            firstError = { message: result.message || "Validation failed." };
          }
          errors.push({ message: result.message || "Validation failed." });
        }
      };

      return (data: Record<string, unknown>): { isValid: boolean; errors: { message: string }[] } => {
        errors.length = 0;
        firstError = undefined;

        for (const step of this.validationSteps) {
          executeValidator(step.validator);
        }

        return {
          isValid: errors.length === 0,
          errors: errors,
        };
      };
    };
}