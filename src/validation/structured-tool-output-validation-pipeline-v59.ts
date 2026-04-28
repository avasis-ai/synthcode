import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationContext {
  inputData: Record<string, unknown>;
  history: Message[];
  previousStepResult: ValidationResult | null;
  contextData: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data: Record<string, unknown>;
}

export interface ValidationStep {
  name: string;
  validate(context: ValidationContext): Promise<ValidationResult>;
}

export class StructuredToolOutputValidationPipeline {
  private steps: ValidationStep[];
  private initialContext: ValidationContext;

  constructor(steps: ValidationStep[], initialContext: ValidationContext) {
    this.steps = steps;
    this.initialContext = initialContext;
  }

  public async run(): Promise<ValidationResult> {
    let currentContext: ValidationContext = {
      inputData: this.initialContext.inputData,
      history: this.initialContext.history,
      previousStepResult: null,
      contextData: { ...this.initialContext.contextData },
    };

    let finalResult: ValidationResult = {
      isValid: true,
      errors: [],
      data: { ...this.initialContext.inputData },
    };

    for (const step of this.steps) {
      try {
        const result = await step.validate(currentContext);

        // Update context for the next step
        currentContext = {
          inputData: currentContext.inputData,
          history: currentContext.history,
          previousStepResult: result,
          contextData: { ...currentContext.contextData, ...result.data },
        };

        // Aggregate results
        if (!result.isValid) {
          finalResult.isValid = false;
          finalResult.errors = [...finalResult.errors, ...result.errors];
        } else {
          finalResult.data = { ...finalResult.data, ...result.data };
        }

      } catch (error) {
        const errorResult: ValidationResult = {
          isValid: false,
          errors: [`Pipeline execution failed at step ${step.name}: ${(error as Error).message}`],
          data: {},
        };
        finalResult.isValid = false;
        finalResult.errors = [...finalResult.errors, ...errorResult.errors];
        currentContext.previousStepResult = errorResult;
        break; // Stop on critical failure
      }
    }

    return finalResult;
  }
}