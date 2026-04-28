import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationContext {
  // Placeholder for context data needed during validation, e.g., previous tool outputs, session state
  [key: string]: any;
}

export interface ValidationError {
  field: string;
  message: string;
  constraint: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface SchemaConstraint {
  name: string;
  validate: (input: Record<string, unknown>, context: ValidationContext) => {
    isValid: boolean;
    error?: ValidationError;
  };
}

export class StructuredToolInputSchemaValidator {
  private constraints: SchemaConstraint[];

  constructor(constraints: SchemaConstraint[]) {
    this.constraints = constraints;
  }

  public validate(input: Record<string, unknown>, context: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];

    for (const constraint of this.constraints) {
      const validationResult = constraint.validate(input, context);
      if (!validationResult.isValid) {
        errors.push(validationResult.error!);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}