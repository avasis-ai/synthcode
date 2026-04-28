import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface SchemaContext {
  previousToolOutputs: Record<string, unknown>;
  currentMessageHistory: Message[];
}

export interface ContextValidator<T> {
  validate(context: SchemaContext, input: T): { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputSchemaValidatorV1002 {
  private contextValidators: { validator: ContextValidator<any>; description: string }[];

  constructor(contextValidators: { validator: ContextValidator<any>; description: string }[]) {
    this.contextValidators = contextValidators;
  }

  public validate<T>(
    context: SchemaContext,
    input: T
  ): { isValid: boolean; errors: string[]; finalContext: SchemaContext } {
    let currentContext: SchemaContext = {
      previousToolOutputs: { ...context.previousToolOutputs },
      currentMessageHistory: [...context.currentMessageHistory],
    };

    let allErrors: string[] = [];
    let overallValid = true;

    for (const { validator, description } of this.contextValidators) {
      try {
        const result = validator.validate(currentContext, input);

        if (!result.isValid) {
          allErrors.push(`Validation failed for ${description}: ${result.errors.join('; ')}`);
          overallValid = false;
        }

        // Update context based on successful validation (simplified for this structure)
        // In a real scenario, the validator might return the *validated* data structure.
        // Here, we just pass the context forward.
        currentContext = {
          previousToolOutputs: { ...currentContext.previousToolOutputs },
          currentMessageHistory: [...currentContext.currentMessageHistory],
        };

      } catch (e) {
        allErrors.push(`Critical validation error during ${description}: ${(e as Error).message}`);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
      finalContext: currentContext,
    };
  }
}