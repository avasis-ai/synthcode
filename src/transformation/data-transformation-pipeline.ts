import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TransformerStep {
  name: string;
  transform: (data: unknown, context: Record<string, unknown>) => Promise<unknown>;
}

class DataTransformationPipelineBuilder {
  private steps: TransformerStep[] = [];

  addStep(step: TransformerStep): this {
    this.steps.push(step);
    return this;
  }

  build(): DataTransformer {
    return new DataTransformer(this.steps);
  }
}

class DataTransformer {
  private steps: TransformerStep[];

  constructor(steps: TransformerStep[]) {
    this.steps = steps;
  }

  async transform(
    initialData: unknown,
    initialContext: Record<string, unknown> = {}
  ): Promise<{ result: unknown; finalContext: Record<string, unknown> }> {
    let currentData: unknown = initialData;
    let currentContext: Record<string, unknown> = { ...initialContext };

    for (const step of this.steps) {
      try {
        currentData = await step.transform(currentData, currentContext);
        // Optionally, allow steps to update context
        // For simplicity, we assume context updates are handled internally or via a dedicated context update mechanism if needed.
      } catch (error) {
        console.error(`Pipeline failed at step: ${step.name}`, error);
        throw new Error(`Transformation failed at step ${step.name}: ${(error as Error).message}`);
      }
    }

    return {
      result: currentData,
      finalContext: currentContext,
    };
  }
}

export { DataTransformationPipelineBuilder, DataTransformer };