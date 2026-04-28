import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

interface ValidationContext {
  inputData: Record<string, unknown>;
  history: Message[];
}

interface ValidationStep {
  execute(context: ValidationContext): { isValid: boolean; errors: string[]; context: Record<string, unknown> };
}

class StructuredToolOutputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  run(initialContext: ValidationContext): { isValid: boolean; errors: string[]; finalContext: Record<string, unknown> } {
    let currentContext = { ...initialContext, inputData: initialContext.inputData };
    let allErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.execute(currentContext);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
      currentContext = { ...currentContext, inputData: result.context };
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      finalContext: currentContext.inputData,
    };
  }
}

class StructuredToolOutputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];
  private conditionalSteps: { condition: (context: ValidationContext) => boolean; step: ValidationStep }[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  addConditionalStep(condition: (context: ValidationContext) => boolean, step: ValidationStep): this {
    this.conditionalSteps.push({ condition, step });
    return this;
  }

  build(): StructuredToolOutputValidationPipeline {
    const allSteps: ValidationStep[] = [...this.steps];

    // Interleave conditional steps execution logic into a single sequence of steps
    // For simplicity in this builder pattern implementation, we will wrap conditional steps
    // into a single composite step that executes the logic.
    const compositeConditionalStep: ValidationStep = {
      execute(context: ValidationContext): { isValid: boolean; errors: string[]; context: Record<string, unknown> } {
        let currentContext = { ...context, inputData: context.inputData };
        let stepErrors: string[] = [];
        let allValid = true;

        for (const { condition, step } of this.conditionalSteps) {
          if (condition(context)) {
            const result = step.execute(context);
            if (!result.isValid) {
              stepErrors.push(...result.errors);
              allValid = false;
            }
            currentContext = { ...currentContext, inputData: result.context };
          }
        }

        return {
          isValid: allValid && stepErrors.length === 0,
          errors: stepErrors,
          context: currentContext.inputData,
        };
      }
    };

    // Append the composite step if any conditional steps were added
    if (this.conditionalSteps.length > 0) {
      allSteps.push(compositeConditionalStep);
    }

    return new StructuredToolOutputValidationPipeline(allSteps);
  }
}

export { StructuredToolOutputValidationPipelineBuilder };