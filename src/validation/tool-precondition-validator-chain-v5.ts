import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = Record<string, unknown>;

export interface PreconditionStep<TContext> {
  execute: (context: TContext) => Promise<ValidationResult>;
}

export interface ToolPreconditionValidatorChain<TContext> {
  steps: PreconditionStep<TContext>[];
  validate: (initialContext: TContext) => Promise<ValidationResult>;
}

class ToolPreconditionValidatorChainBuilder<TContext> {
  private steps: PreconditionStep<TContext>[] = [];

  addStep(step: PreconditionStep<TContext>): this {
    this.steps.push(step);
    return this;
  }

  build(): ToolPreconditionValidatorChain<TContext> {
    return {
      steps: this.steps,
      validate: async (initialContext: TContext): Promise<ValidationResult> => {
        let currentContext: TContext = initialContext;
        let finalResults: ValidationResult = {};

        for (const step of this.steps) {
          try {
            const stepResult = await step.execute(currentContext);
            finalResults = { ...finalResults, ...stepResult };

            // Simple context update mechanism: merge results into the context for the next step
            // In a real system, context update would be more sophisticated.
            if (typeof currentContext === 'object' && currentContext !== null) {
                currentContext = { ...(currentContext as Record<string, unknown>), ...stepResult };
            } else {
                currentContext = stepResult as unknown as TContext;
            }

          } catch (error) {
            // Fail fast on any step error
            throw new Error(`Precondition validation failed at a step: ${(error as Error).message}`);
          }
        }
        return finalResults;
      },
    };
  }
}

export class ToolPreconditionValidatorChainFactory {
  static create<TContext>(builder: (builder: ToolPreconditionValidatorChainBuilder<TContext>) => void): ToolPreconditionValidatorChain<TContext> {
    const builderInstance = new ToolPreconditionValidatorChainBuilder<TContext>();
    builder(builderInstance);
    return builderInstance.build();
  }
}