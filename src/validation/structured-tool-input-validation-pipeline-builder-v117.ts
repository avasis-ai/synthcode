import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidationContext {
  inputData: Record<string, unknown>;
  messages: Message[];
}

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: ValidationContext;
};

type ValidatorFunction = (context: ValidationContext) => {
  isValid: boolean;
  errors: string[];
};

interface ValidationStep {
  execute: (context: ValidationContext) => {
    isValid: boolean;
    errors: string[];
  };
}

class StructuredToolInputValidationPipelineBuilder {
  private baseSchema: Record<string, unknown>;
  private steps: ValidationStep[] = [];

  constructor(baseSchema: Record<string, unknown>) {
    this.baseSchema = baseSchema;
  }

  addRequiredField(fieldName: string): StructuredToolInputValidationPipelineBuilder {
    this.steps.push({
      execute: (context) => {
        const value = context.inputData[fieldName];
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          return { isValid: false, errors: [`Field '${fieldName}' is required.`] };
        }
        return { isValid: true, errors: [] };
      },
    });
    return this;
  }

  addCrossFieldValidator(validator: (data: Record<string, unknown>) => {
    isValid: boolean;
    errors: string[];
  }): StructuredToolInputValidationPipelineBuilder {
    this.steps.push({
      execute: (context) => {
        const result = validator(context.inputData);
        return { isValid: result.isValid, errors: result.errors };
      },
    });
    return this;
  }

  addCustomLogicStep(logic: (context: ValidationContext) => {
    isValid: boolean;
    errors: string[];
  }): StructuredToolInputValidationPipelineBuilder {
    this.steps.push({
      execute: (context) => {
        return logic(context);
      },
    });
    return this;
  }

  build(): {
    validate: (inputData: Record<string, unknown>, messages: Message[] = []) => ValidationResult;
  } {
    const pipeline: (inputData: Record<string, unknown>, messages: Message[] = []) => ValidationResult = (inputData, messages) => {
      const context: ValidationContext = {
        inputData,
        messages: messages || [],
      };
      let allErrors: string[] = [];
      let overallValid = true;

      for (const step of this.steps) {
        const result = step.execute(context);
        if (!result.isValid) {
          allErrors = allErrors.concat(result.errors);
          overallValid = false;
        }
      }

      return {
        isValid: overallValid,
        errors: allErrors,
        context: context,
      };
    };

    return { validate: pipeline };
  }
}

export { StructuredToolInputValidationPipelineBuilder };