import { Message, ToolResultMessage } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
}

export interface ValidationStep {
  execute(context: {
    previousOutputs: Record<string, unknown>;
    currentToolOutput: ToolResultMessage;
  }): ValidationResult;
}

export abstract class BaseValidationPipeline {
  protected steps: ValidationStep[] = [];

  protected addStep(step: ValidationStep): void {
    this.steps.push(step);
  }

  public abstract validate(context: {
    previousOutputs: Record<string, unknown>;
    currentToolOutput: ToolResultMessage;
  }): ValidationResult;
}

export class StructuredToolOutputValidationPipeline extends BaseValidationPipeline {
  constructor() {
    super();
  }

  public addStep(step: ValidationStep): void {
    super.addStep(step);
  }

  public validate(context: {
    previousOutputs: Record<string, unknown>;
    currentToolOutput: ToolResultMessage;
  }): ValidationResult {
    let allErrors: string[] = [];
    let currentContext: Record<string, unknown> = {
      ...context.previousOutputs,
      tool_result: context.currentToolOutput,
    };

    for (const step of this.steps) {
      const result = step.execute({
        previousOutputs: currentContext,
        currentToolOutput: context.currentToolOutput,
      });

      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
      
      if (result.context) {
        currentContext = { ...currentContext, ...result.context };
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      context: currentContext,
    };
  }
}