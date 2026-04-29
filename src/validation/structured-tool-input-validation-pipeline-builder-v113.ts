import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  data: Record<string, unknown>;
};

type ValidatorFunction = (data: Record<string, unknown>, context: Record<string, any>) => ValidationResult;

interface ValidationStep {
  validator: ValidatorFunction;
  condition?: (context: Record<string, any>) => boolean;
  onSuccess?: (data: Record<string, unknown>, context: Record<string, any>) => { data: Record<string, unknown>; context: Record<string, any> };
  onFailure?: (data: Record<string, unknown>, context: Record<string, any>) => { data: Record<string, unknown>; context: Record<string, any> };
}

export class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];

  private constructor() {}

  public static getInstance(): StructuredToolInputValidationPipelineBuilder {
    if (!StructuredToolInputValidationPipelineBuilder.instance) {
      StructuredToolInputValidationPipelineBuilder.instance = new StructuredToolInputValidationPipelineBuilder();
    }
    return StructuredToolInputValidationPipelineBuilder.instance;
  }

  public addStep(validator: ValidatorFunction, condition?: (context: Record<string, any>) => boolean): this {
    this.steps.push({ validator, condition });
    return this;
  }

  public addStepWithCondition(validator: ValidatorFunction, condition: (context: Record<string, any>) => boolean): this {
    this.steps.push({ validator, condition });
    return this;
  }

  public addStepWithHooks(
    validator: ValidatorFunction,
    condition: (context: Record<string, any>) => boolean,
    onSuccess: (data: Record<string, unknown>, context: Record<string, any>) => { data: Record<string, unknown>; context: Record<string, any> },
    onFailure: (data: Record<string, unknown>, context: Record<string, any>) => { data: Record<string, unknown>; context: Record<string, any> }
  ): this {
    this.steps.push({ validator, condition, onSuccess, onFailure });
    return this;
  }

  public build(): { validate: (initialData: Record<string, unknown>, initialContext: Record<string, any>) => ValidationResult } {
    return {
      validate: (initialData: Record<string, unknown>, initialContext: Record<string, any>): ValidationResult => {
        let currentData: Record<string, unknown> = { ...initialData };
        let currentContext: Record<string, any> = { ...initialContext };
        let allErrors: string[] = [];

        for (const step of this.steps) {
          if (step.condition && !step.condition(currentContext)) {
            continue;
          }

          let result: ValidationResult;
          let nextData: Record<string, unknown> = { ...currentData };
          let nextContext: Record<string, any> = { ...currentContext };

          try {
            result = step.validator(currentData, currentContext);
          } catch (e) {
            result = { isValid: false, errors: [`Execution error: ${e instanceof Error ? e.message : String(e)}`], data: currentData };
          }

          if (!result.isValid) {
            allErrors.push(...result.errors);
            // Stop or continue based on desired behavior. Here, we continue but record the error.
          }

          // Apply hooks and update state
          if (result.isValid) {
            if (step.onSuccess) {
              const hooksResult = step.onSuccess(result.data, result.context);
              nextData = { ...nextData, ...hooksResult.data };
              nextContext = { ...nextContext, ...hooksResult.context };
            } else {
              nextData = { ...nextData, ...result.data };
              nextContext = { ...nextContext, ...result.context };
            }
          } else {
            if (step.onFailure) {
              const hooksResult = step.onFailure(result.data, result.context);
              nextData = { ...nextData, ...hooksResult.data };
              nextContext = { ...nextContext, ...hooksResult.context };
            }
          }

          currentData = nextData;
          currentContext = nextContext;
        }

        return {
          isValid: allErrors.length === 0,
          errors: allErrors,
          data: currentData,
        };
      },
    };
  }
}

StructuredToolInputValidationPipelineBuilder.instance = StructuredToolInputValidationPipelineBuilder.getInstance();