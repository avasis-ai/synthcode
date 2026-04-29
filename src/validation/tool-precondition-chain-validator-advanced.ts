import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, any>;
};

export interface PreconditionStep {
  name: string;
  execute: (context: Record<string, any>, messages: Message[], toolInputs: Record<string, unknown>) => Promise<{
    isValid: boolean;
    error?: string;
    contextUpdate?: Record<string, any>;
  }>;
}

export class ToolPreconditionChainValidatorAdvanced {
  private steps: PreconditionStep[];

  constructor(steps: PreconditionStep[]) {
    this.steps = steps;
  }

  public async validate(
    context: Record<string, any>,
    messages: Message[],
    toolInputs: Record<string, unknown>
  ): Promise<ValidationResult> {
    let currentContext: Record<string, any> = { ...context };
    const errors: string[] = [];
    let allValid = true;

    for (const step of this.steps) {
      try {
        const result = await step.execute(
          currentContext,
          messages,
          toolInputs
        );

        if (!result.isValid) {
          allValid = false;
          errors.push(`[${step.name}]: ${result.error || "Validation failed."}`);
        } else {
          if (result.contextUpdate) {
            currentContext = { ...currentContext, ...result.contextUpdate };
          }
        }
      } catch (e) {
        allValid = false;
        errors.push(`[${step.name}]: Execution failed due to an error: ${(e as Error).message}`);
      }
    }

    return {
      isValid: allValid,
      errors: errors,
      context: currentContext,
    };
  }
}