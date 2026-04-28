import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ValidatorFunction<T> = (data: T, context: Record<string, unknown>) => { isValid: boolean; message?: string };

interface SchemaDefinition {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object";
    required?: boolean;
    schema?: Record<string, SchemaDefinition>;
  };
}

interface ValidationStep {
  validator: ValidatorFunction<any>;
  condition?: (context: Record<string, unknown>) => boolean;
  name: string;
}

export class StructuredToolOutputValidationPipelineBuilder {
  private schema: SchemaDefinition;
  private steps: ValidationStep[] = [];

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  addRequiredFieldValidator(fieldName: string): StructuredToolOutputValidationPipelineBuilder {
    const validator: ValidatorFunction<Record<string, unknown>> = (data) => {
      if (!(fieldName in data) || data[fieldName] === null || data[fieldName] === undefined) {
        return { isValid: false, message: `${fieldName} is required.` };
      }
      return { isValid: true };
    };

    this.steps.push({
      validator: validator,
      name: `RequiredFieldValidator:${fieldName}`,
    });
    return this;
  }

  addTypeValidator(fieldName: string, expectedType: "string" | "number" | "boolean"): StructuredToolOutputValidationPipelineBuilder {
    const validator: ValidatorFunction<Record<string, unknown>> = (data) => {
      const value = data[fieldName];
      if (value === undefined || value === null) {
        return { isValid: true }; // Handled by required check if necessary
      }
      const actualType = typeof value;
      if (expectedType === "string" && actualType !== "string") {
        return { isValid: false, message: `${fieldName} must be a string.` };
      }
      if (expectedType === "number" && actualType !== "number") {
        return { isValid: false, message: `${fieldName} must be a number.` };
      }
      if (expectedType === "boolean" && actualType !== "boolean") {
        return { isValid: false, message: `${fieldName} must be a boolean.` };
      }
      return { isValid: true };
    };

    this.steps.push({
      validator: validator,
      name: `TypeValidator:${fieldName}:${expectedType}`,
    });
    return this;
  }

  addCrossFieldDependencyValidator(
    fieldName: string,
    dependencyField: string,
    condition: (context: Record<string, unknown>) => boolean,
    validator: ValidatorFunction<Record<string, unknown>>
  ): StructuredToolOutputValidationPipelineBuilder {
    this.steps.push({
      validator: validator,
      condition: condition,
      name: `CrossFieldValidator:${fieldName}DependsOn:${dependencyField}`,
    });
    return this;
  }

  addConditionalValidator(
    condition: (context: Record<string, unknown>) => boolean,
    validator: ValidatorFunction<Record<string, unknown>>,
    name: string
  ): StructuredToolOutputValidationPipelineBuilder {
    this.steps.push({
      validator: validator,
      condition: condition,
      name: name,
    });
    return this;
  }

  buildPipeline(): {
    steps: ValidationStep[];
    schema: SchemaDefinition;
  } {
    return {
      steps: [...this.steps],
      schema: this.schema,
    };
  }
}