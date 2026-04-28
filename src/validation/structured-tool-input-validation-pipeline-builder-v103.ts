import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type ValidationStep = (
  inputs: Record<string, unknown>
) => {
  result: ValidationResult;
  context: Record<string, unknown>;
};

interface Condition {
  (inputs: Record<string, unknown>): boolean;
}

export class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];
  private conditions: Map<string, Condition> = new Map();

  constructor() {}

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  addConditionalStep(condition: Condition, step: ValidationStep): this {
    const conditionKey = `cond_${this.steps.length + this.conditions.size}`;
    this.conditions.set(conditionKey, condition);
    this.steps.push({
      run: (inputs: Record<string, unknown>): ValidationResult => {
        if (condition(inputs)) {
          return step(inputs);
        }
        return { isValid: true, errors: [] };
      },
      context: (inputs: Record<string, unknown>) => ({ ...inputs })
    } as unknown as ValidationStep; // Type assertion to fit the structure, though we modify the step execution logic slightly
    return this;
  }

  addStepIf(condition: Condition, step: ValidationStep): this {
    return this.addConditionalStep(condition, step);
  }

  private compilePipeline(): {
    execute: (inputs: Record<string, unknown>) => ValidationResult;
  } {
    const compiledSteps: ValidationStep[] = this.steps.map(step => {
      // Re-implementing the step execution to handle potential conditional wrapping if necessary,
      // but for simplicity and adherence to the builder pattern, we assume the added steps are runnable.
      return step;
    });

    return {
      execute: (inputs: Record<string, unknown>): ValidationResult => {
        let currentContext: Record<string, unknown> = { ...inputs };
        let allErrors: string[] = [];

        for (const step of compiledSteps) {
          try {
            const result = step(currentContext);
            if (!result.isValid) {
              allErrors.push(...result.errors);
            }
            // Update context with the step's context output
            currentContext = { ...currentContext, ...result.context };
          } catch (e) {
            allErrors.push(`Pipeline execution failed in a step: ${(e as Error).message}`);
          }
        }

        return {
          isValid: allErrors.length === 0,
          errors: allErrors,
        };
      },
    };
  }

  build(): {
    execute: (inputs: Record<string, unknown>) => ValidationResult;
  } {
    return this.compilePipeline();
  }
}