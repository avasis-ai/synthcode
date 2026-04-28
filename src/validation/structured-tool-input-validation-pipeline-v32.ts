import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidationContext {
  inputs: Record<string, unknown>;
  allMessages: Message[];
}

type FieldRelationshipValidator = (
  context: ValidationContext,
  fieldA: string,
  fieldB: string,
) => { isValid: boolean; message?: string };

interface ValidationStep {
  execute: (context: ValidationContext) => { isValid: boolean; message?: string };
}

class StructuredToolInputValidationPipelineV32 {
  private steps: ValidationStep[] = [];

  constructor() {}

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  validate(context: ValidationContext): { isValid: boolean; message?: string } {
    for (const step of this.steps) {
      const result = step.execute(context);
      if (!result.isValid) {
        return { isValid: false, message: result.message };
      }
    }
    return { isValid: true };
  }
}

class BasicSchemaValidator implements ValidationStep {
  private requiredFields: Record<string, boolean>;

  constructor(requiredFields: string[]) {
    this.requiredFields = Object.fromEntries(
      requiredFields.map((field) => [field, true])
    );
  }

  execute(context: ValidationContext): { isValid: boolean; message?: string } {
    for (const field of Object.keys(this.requiredFields)) {
      if (context.inputs[field] === undefined || context.inputs[field] === null) {
        return {
          isValid: false,
          message: `Missing required field: ${field}`,
        };
      }
    }
    return { isValid: true };
  }
}

class TemporalDependencyValidator implements ValidationStep {
  private dependencies: {
    fieldA: string;
    fieldB: string;
    validator: (a: any, b: any) => boolean;
    errorMessage: string;
  }[];

  constructor(dependencies: {
    fieldA: string;
    fieldB: string;
    validator: (a: any, b: any) => boolean;
    errorMessage: string;
  }[] = []) {
    this.dependencies = dependencies;
  }

  execute(context: ValidationContext): { isValid: boolean; message?: string } {
    for (const dep of this.dependencies) {
      const valA = context.inputs[dep.fieldA];
      const valB = context.inputs[dep.fieldB];

      if (valA === undefined || valB === undefined) continue;

      if (!dep.validator(valA, valB)) {
        return {
          isValid: false,
          message: `Temporal dependency failed between ${dep.fieldA} and ${dep.fieldB}: ${dep.errorMessage}`,
        };
      }
    }
    return { isValid: true };
  }
}

export {
  StructuredToolInputValidationPipelineV32,
  BasicSchemaValidator,
  TemporalDependencyValidator,
}