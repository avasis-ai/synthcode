import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type ValidationContext = {
  input: any;
  schema: any;
};

export interface SchemaValidatorStep {
  execute(context: ValidationContext): ValidationResult;
}

export interface SchemaDefinition {
  steps: SchemaValidatorStep[];
}

export class StructuredToolInputSchemaValidatorV51 {
  private steps: SchemaValidatorStep[];

  constructor(steps: SchemaValidatorStep[]) {
    this.steps = steps;
  }

  public validate(input: any, schema: SchemaDefinition): ValidationResult {
    const context: ValidationContext = { input, schema };
    let accumulatedErrors: string[] = [];
    let overallValid: boolean = true;

    for (const step of this.steps) {
      const result = step.execute(context);
      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: accumulatedErrors,
    };
  }

  public static create(steps: SchemaValidatorStep[]): StructuredToolInputSchemaValidatorV51 {
    return new StructuredToolInputSchemaValidatorV51(steps);
  }
}