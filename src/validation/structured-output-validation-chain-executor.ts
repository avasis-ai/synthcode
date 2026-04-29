import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationError = {
  stepName: string;
  field: string;
  message: string;
  details?: any;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

export type ValidationStep = (
  input: Record<string, unknown>
) => {
  result: Record<string, unknown>;
  errors: ValidationError[];
};

export class StructuredOutputValidationChainExecutor {
  private readonly validationSteps: ValidationStep[];

  constructor(validationSteps: ValidationStep[]) {
    this.validationSteps = validationSteps;
  }

  execute(input: Record<string, unknown>): ValidationResult {
    let currentContext: Record<string, unknown> = { ...input };
    const allErrors: ValidationError[] = [];

    for (let i = 0; i < this.validationSteps.length; i++) {
      const step = this.validationSteps[i];
      const stepName = `Step ${i + 1}`;

      try {
        const { result, errors } = step(currentContext);
        
        if (errors && errors.length > 0) {
          allErrors.push(...errors);
        }
        
        // Update context for the next step, assuming the step modifies the structure
        currentContext = result || currentContext;
      } catch (e) {
        allErrors.push({
          stepName: stepName,
          field: "Execution",
          message: `Execution failed: ${(e as Error).message}`,
          details: e,
        });
        // Stop execution on critical failure
        break;
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}