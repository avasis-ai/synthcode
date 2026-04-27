import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  suggestions?: Record<string, string>;
};

type FieldValue = unknown;

interface SchemaConstraint {
  field: string;
  type: "required" | "type-check" | "regex" | "conditional";
  value?: any;
  message: string;
  condition?: {
    if: {
      field: string;
      operator: "equals" | "not-equals" | "greater-than" | "less-than";
      value: any;
    };
    then: SchemaConstraint;
    else: SchemaConstraint;
  };
}

class SchemaValidator {
  private constraints: SchemaConstraint[];

  constructor(constraints: SchemaConstraint[]) {
    this.constraints = constraints;
  }

  private validateField(
    field: string,
    value: FieldValue,
    constraint: SchemaConstraint
  ): ValidationResult {
    if (constraint.type === "required") {
      if (value === null || value === undefined || value === "") {
        return {
          isValid: false,
          errors: [`Field '${field}' is required but missing.`],
          suggestions: {
            [field]: "Provide a non-empty string or object.",
          },
        };
      }
    }

    if (constraint.type === "type-check") {
      const expectedType = constraint.value;
      if (typeof value !== expectedType) {
        return {
          isValid: false,
          errors: [`Field '${field}' expected type ${expectedType}, but got ${typeof value}.`],
          suggestions: {
            [field]: `Ensure the value is of type ${expectedType}.`,
          },
        };
      }
    }

    if (constraint.type === "regex") {
      const regex = new RegExp(constraint.value);
      if (typeof value === "string" && !regex.test(value)) {
        return {
          isValid: false,
          errors: [`Field '${field}' failed regex validation. Must match pattern: ${constraint.value}`],
          suggestions: {
            [field]: `Update the field to match the required pattern.`,
          },
        };
      }
    }

    if (constraint.type === "conditional") {
      const condition = constraint.condition!;
      const fieldValue = this.getFieldValue(condition.if.field);

      let conditionMet = false;
      switch (condition.if.operator) {
        case "equals":
          conditionMet = fieldValue === condition.if.value;
          break;
        case "not-equals":
          conditionMet = fieldValue !== condition.if.value;
          break;
        case "greater-than":
          conditionMet = typeof fieldValue === "number" && fieldValue > condition.if.value;
          break;
        case "less-than":
          conditionMet = typeof fieldValue === "number" && fieldValue < condition.if.value;
          break;
      }

      let nextConstraint: SchemaConstraint;
      if (conditionMet) {
        nextConstraint = condition.then;
      } else {
        nextConstraint = condition.else;
      }

      return this.validateField(field, value, nextConstraint);
    }

    return { isValid: true, errors: [], suggestions: undefined };
  }

  private getFieldValue(field: string): FieldValue {
    // Simplified implementation: assumes validation context provides a root object
    // In a real scenario, this would traverse a complex object structure.
    return (globalThis as any).validationContext?.[field] || undefined;
  }

  public validate(data: Record<string, any>): ValidationResult {
    (globalThis as any).validationContext = data;
    let allErrors: string[] = [];
    let allSuggestions: Record<string, string> = {};
    let overallValid = true;

    for (const constraint of this.constraints) {
      const result = this.validateField(constraint.field, data[constraint.field], constraint);
      if (!result.isValid) {
        overallValid = false;
        allErrors.push(...result.errors);
        if (result.suggestions) {
          Object.assign(allSuggestions, result.suggestions);
        }
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
      suggestions: allSuggestions,
    };
  }
}

export class StructuredOutputSchemaValidationPipelineV5 {
  private constraints: SchemaConstraint[];

  constructor(constraints: SchemaConstraint[]) {
    this.constraints = constraints;
  }

  public validate(data: Record<string, any>): ValidationResult {
    const validator = new SchemaValidator(this.constraints);
    return validator.validate(data);
  }
}