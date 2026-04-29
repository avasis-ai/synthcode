import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Validator = (input: Record<string, unknown>) => { isValid: boolean; errors: string[] };
type Condition = (input: Record<string, unknown>) => boolean;

interface ValidationStep {
  type: "sequential" | "conditional" | "parallel";
  steps: any[];
}

abstract class BaseValidationPipelineBuilder {
  protected pipeline: ValidationStep[] = [];

  protected addStep(step: ValidationStep): void {
    this.pipeline.push(step);
  }

  public abstract build(): any;
}

class StructuredToolInputValidationPipelineBuilderV127Advanced extends BaseValidationPipelineBuilder {
  public addSequentialStep(validators: Validator[]): void {
    this.addStep({ type: "sequential", steps: validators });
  }

  public conditionalStep(condition: Condition, validator: Validator): void {
    this.addStep({
      type: "conditional",
      steps: [{ condition, validator }],
    });
  }

  public parallelStep(validators: Validator[]): void {
    this.addStep({ type: "parallel", steps: validators });
  }

  public build(): any {
    return {
      pipeline: this.pipeline,
      metadata: {
        version: "v127-advanced",
        description: "Advanced structured tool input validation pipeline.",
      },
    };
  }
}

export {
  StructuredToolInputValidationPipelineBuilderV127Advanced,
}