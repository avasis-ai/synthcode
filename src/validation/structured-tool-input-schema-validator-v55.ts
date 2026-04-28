import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface StructuredInputValidationStep {
  name: string;
  validate(
    input: Record<string, unknown>,
    context: {
      history: Message[];
      currentToolUse: ToolUseBlock | null;
    }
  ): { isValid: boolean; errors: string[]; contextUpdates?: Record<string, unknown> };
}

export class StructuredToolInputSchemaValidatorV55 {
  private steps: StructuredInputValidationStep[];

  constructor(steps: StructuredInputValidationStep[] = []) {
    this.steps = steps;
  }

  public validate(
    input: Record<string, unknown>,
    context: {
      history: Message[];
      currentToolUse: ToolUseBlock | null;
    }
  ): { isValid: boolean; errors: string[]; finalContextUpdates: Record<string, unknown> } {
    let currentContextUpdates: Record<string, unknown> = {};
    let allErrors: string[] = [];
    let allValid = true;

    for (const step of this.steps) {
      const result = step.validate(input, {
        history: context.history,
        currentToolUse: context.currentToolUse,
      });

      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }

      if (result.contextUpdates) {
        currentContextUpdates = { ...currentContextUpdates, ...result.contextUpdates };
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
      finalContextUpdates: currentContextUpdates,
    };
  }
}