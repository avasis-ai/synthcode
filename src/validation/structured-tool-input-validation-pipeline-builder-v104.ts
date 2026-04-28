import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

type ValidationStep = (context: Record<string, unknown>) => Promise<ValidationResult>;

interface ValidationPipeline {
  execute: (initialContext: Record<string, unknown>) => Promise<ValidationResult>;
}

class ValidationPipelineBuilder {
  private steps: ValidationStep[] = [];
  private parallelGroups: ValidationStep[][] = [];

  constructor(private initialContext: Record<string, unknown>) {}

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  addParallelGroup(steps: ValidationStep[]): this {
    this.parallelGroups.push(steps);
    return this;
  }

  private async executeParallel(steps: ValidationStep[], context: Record<string, unknown>): Promise<ValidationResult> {
    const promises: Promise<ValidationResult>[] = steps.map(step => step(context));
    const results = await Promise.all(promises);

    const allErrors: string[] = [];
    let allValid = true;

    for (const result of results) {
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
      context: this.mergeContext(context, ...results.map(r => r.context)),
    };
  }

  private mergeContext(base: Record<string, unknown>, ...contexts: Record<string, unknown>[]): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...base };
    for (const context of contexts) {
      Object.assign(merged, context);
    }
    return merged;
  }

  public build(): ValidationPipeline {
    return {
      execute: async (initialContext: Record<string, unknown>): Promise<ValidationResult> => {
        let currentContext = { ...initialContext };
        let currentResult: ValidationResult = { isValid: true, errors: [], context: { ...initialContext } };

        // 1. Execute sequential steps
        for (const step of this.steps) {
          const result = await step(currentContext);
          currentResult.errors.push(...result.errors);
          currentResult.isValid = result.isValid && currentResult.isValid;
          currentResult.context = this.mergeContext(currentResult.context, result.context);

          if (!result.isValid) {
            // Early exit logic based on sequential failure
            return {
              isValid: false,
              errors: [...currentResult.errors, ...result.errors],
              context: currentResult.context,
            };
          }
          currentContext = result.context;
        }

        // 2. Execute parallel groups
        for (const groupSteps of this.parallelGroups) {
          const result = await this.executeParallel(groupSteps, currentContext);
          currentResult.errors.push(...result.errors);
          currentResult.isValid = result.isValid && currentResult.isValid;
          currentResult.context = this.mergeContext(currentResult.context, result.context);
          
          if (!result.isValid) {
             // Early exit logic based on parallel failure
            return {
              isValid: false,
              errors: [...currentResult.errors, ...result.errors],
              context: currentResult.context,
            };
          }
          // Update context for subsequent steps/groups
          currentContext = result.context;
        }

        return {
          isValid: currentResult.isValid,
          errors: currentResult.errors,
          context: currentResult.context,
        };
      },
    };
  }
}

export { ValidationPipelineBuilder };