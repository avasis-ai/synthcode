import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface ValidationResult {
  isValid: boolean;
  data: Record<string, unknown>;
  errors: string[];
}

export interface ValidationStep {
  name: string;
  execute: (context: { initialInput: Record<string, unknown>; currentContext: Record<string, unknown> }) => Promise<ValidationResult>;
  condition?: (context: { initialInput: Record<string, unknown>; currentContext: Record<string, unknown> }) => boolean;
}

export class ToolInputValidationPipelineV2 {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public async validate(initialInput: Record<string, unknown>): Promise<ValidationResult> {
    let currentContext: Record<string, unknown> = { ...initialInput };
    let aggregatedErrors: string[] = [];

    for (const step of this.steps) {
      if (step.condition && !step.condition({ initialInput: initialInput, currentContext: currentContext })) {
        continue;
      }

      try {
        const result = await step.execute({ initialInput: initialInput, currentContext: currentContext });

        if (!result.isValid) {
          aggregatedErrors.push(...result.errors);
        }

        // Update context with the validated/modified data from the step
        currentContext = { ...currentContext, ...result.data };

      } catch (error) {
        aggregatedErrors.push(`Step "${step.name}" failed unexpectedly: ${(error as Error).message}`);
        // Stop processing or continue based on desired behavior; here we continue but record the error.
      }
    }

    const finalResult: ValidationResult = {
      isValid: aggregatedErrors.length === 0,
      data: currentContext,
      errors: aggregatedErrors,
    };

    return finalResult;
  }
}