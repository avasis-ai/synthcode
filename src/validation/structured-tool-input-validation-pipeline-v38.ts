import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidationContext {
  data: Record<string, unknown>;
  messages: Message[];
}

interface ValidationStep {
  validate: (context: ValidationContext) => {
    isValid: boolean;
    errors: string[];
  };
}

interface CrossFieldDependencyStep extends ValidationStep {
  fields: string[];
  dependencyCheck: (data: Record<string, unknown>) => {
    isValid: boolean;
    errors: string[];
  };
}

abstract class BaseValidationPipeline {
  protected steps: ValidationStep[] = [];

  protected addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public async validate(context: ValidationContext): Promise<{ isValid: boolean; errors: string[] }> {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step.validate(context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        overallValid = false;
      }
    }

    return { isValid: overallValid, errors: allErrors };
  }
}

export class StructuredToolInputValidationPipeline extends BaseValidationPipeline {
  constructor() {
    super();
  }

  public withSchema(schema: Record<string, any>): this {
    // In a real implementation, this would process the schema into initial validation steps.
    // For this exercise, we just acknowledge the schema input.
    console.log("Schema loaded for validation context.");
    return this;
  }

  public addCrossFieldDependencyStep(
    fields: string[],
    dependencyCheck: (data: Record<string, unknown>) => {
      isValid: boolean;
      errors: string[];
    }
  ): this {
    const step: CrossFieldDependencyStep = {
      validate: (context) => {
        const result = dependencyCheck(context.data);
        return {
          isValid: result.isValid,
          errors: result.errors,
        };
      },
      fields: fields,
      dependencyCheck: dependencyCheck,
    };
    return this.addStep(step);
  }
}