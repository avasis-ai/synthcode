import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: {
    stepName: string;
    message: string;
    context: any;
  }[];
};

type Validator = (context: any) => {
  isValid: boolean;
  error?: string;
};

type Condition = (context: any) => boolean;

export class ToolOutputValidationChainBuilderAdvanced {
  private steps: {
    condition: Condition;
    validator: Validator;
    name: string;
  }[];
  private readonly initialContext: any;

  constructor(initialContext: any) {
    this.steps = [];
    this.initialContext = initialContext;
  }

  public addStep(name: string, validator: Validator): this {
    this.steps.push({
      condition: () => true,
      validator: validator,
      name: name,
    });
    return this;
  }

  public addConditionalStep(name: string, condition: Condition, validator: Validator): this {
    this.steps.push({
      condition: condition,
      validator: validator,
      name: name,
    });
    return this;
  }

  public buildChain(): {
    validate: (context: any) => Promise<ValidationResult>;
  } {
    const validateChain = async (context: any): Promise<ValidationResult> => {
      let currentContext = { ...this.initialContext, ...context };
      const failedSteps: {
        stepName: string;
        message: string;
        context: any;
      }[] = [];

      for (const step of this.steps) {
        if (step.condition(currentContext)) {
          try {
            const result = step.validator(currentContext);
            if (!result.isValid) {
              failedSteps.push({
                stepName: step.name,
                message: result.error || "Validation failed",
                context: currentContext,
              });
            }
          } catch (e) {
            failedSteps.push({
              stepName: step.name,
              message: `Execution error: ${(e as Error).message}`,
              context: currentContext,
            });
          }
        }
      }

      const finalResult: ValidationResult = {
        isValid: failedSteps.length === 0,
        errors: failedSteps,
      };

      return finalResult;
    };

    return {
      validate: validateChain,
    };
  }
}