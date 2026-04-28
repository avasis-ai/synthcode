import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ValidationContext {
  inputData: Record<string, unknown>;
  history: Message[];
  globalContext: Record<string, unknown>;
  getPreviousStepResult: (stepName: string) => unknown | null;
  getGlobalContext: (key: string) => unknown | undefined;
}

interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    path: string[];
    severity: "error" | "warning";
    evidence?: any;
  }[];
}

interface ValidationStep {
  name: string;
  execute: (context: ValidationContext) => Promise<ValidationResult>;
}

class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): StructuredToolInputValidationPipelineV54 {
    return new StructuredToolInputValidationPipelineV54(this.steps);
  }
}

export class StructuredToolInputValidationPipelineV54 {
  private readonly steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  async validate(
    inputData: Record<string, unknown>,
    history: Message[],
    globalContext: Record<string, unknown>
  ): Promise<ValidationResult> {
    const context: ValidationContext = {
      inputData,
      history,
      globalContext,
      getPreviousStepResult: (stepName) => {
        // Simplified implementation for demonstration
        const step = this.steps.find(s => s.name === stepName);
        if (step) {
          // In a real scenario, we'd store and retrieve results per step execution
          return "Simulated previous result";
        }
        return null;
      },
      getGlobalContext: (key) => globalContext[key],
    };

    let accumulatedErrors: {
      field: string;
      message: string;
      path: string[];
      severity: "error" | "warning";
      evidence?: any;
    }[] = [];

    for (const step of this.steps) {
      try {
        const result = await step.execute(context);
        if (!result.isValid) {
          accumulatedErrors.push(...result.errors);
        }
      } catch (error) {
        accumulatedErrors.push({
          field: "pipeline",
          message: `Execution failed for step ${step.name}: ${(error as Error).message}`,
          path: ["pipeline"],
          severity: "error",
        });
      }
    }

    const finalResult: ValidationResult = {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
    };

    return finalResult;
  }
}