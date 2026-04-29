import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidatorStep {
  validate: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
  description: string;
}

interface ConditionalStage {
  condition: (output: Record<string, unknown>) => boolean;
  validators: ValidatorStep[];
}

export class StructuredToolOutputValidationPipelineBuilder {
  private validators: ValidatorStep[] = [];
  private conditionalStages: ConditionalStage[] = [];

  addValidator(validator: ValidatorStep): this {
    this.validators.push(validator);
    return this;
  }

  addConditionalStage(
    condition: (output: Record<string, unknown>) => boolean,
    validators: ValidatorStep[]
  ): this {
    this.conditionalStages.push({ condition, validators });
    return this;
  }

  build(): {
    run: (output: Record<string, unknown>) => { isValid: boolean; errors: string[]; executionPath: string[] };
    stages: {
      validators: ValidatorStep[];
      conditionalStages: ConditionalStage[];
    };
  } {
    const runPipeline = (output: Record<string, unknown>): { isValid: boolean; errors: string[]; executionPath: string[] } => {
      const allErrors: string[] = [];
      let isValid = true;
      const executionPath: string[] = [];

      // 1. Run sequential validators
      for (const validator of this.validators) {
        const result = validator.validate(output);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          isValid = false;
        }
        executionPath.push(`Sequential: ${validator.description}`);
      }

      // 2. Run conditional stages
      for (let i = 0; i < this.conditionalStages.length; i++) {
        const stage = this.conditionalStages[i];
        if (stage.condition(output)) {
          executionPath.push(`Conditional Stage ${i}: Executing`);
          for (const validator of stage.validators) {
            const result = validator.validate(output);
            if (!result.isValid) {
              allErrors.push(...result.errors);
              isValid = false;
            }
            executionPath.push(`  -> ${validator.description}`);
          }
        } else {
          executionPath.push(`Conditional Stage ${i}: Skipped`);
        }
      }

      return {
        isValid: isValid && allErrors.length === 0,
        errors: allErrors,
        executionPath: executionPath,
      };
    };

    return {
      run: runPipeline,
      stages: {
        validators: this.validators,
        conditionalStages: this.conditionalStages,
      },
    };
  }
}