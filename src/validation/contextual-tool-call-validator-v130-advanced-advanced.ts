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

type ValidationContext = {
  history: Message[];
  metadata: Record<string, unknown>;
  toolCall: {
    name: string;
    input: Record<string, unknown>;
  };
};

type ValidatorFunction = (context: ValidationContext) => {
  isValid: boolean;
  errors: string[];
  context: ValidationContext;
};

interface ValidatorBuilder {
  addPreValidationStep(validator: (context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }) : ValidatorBuilder;
  addBusinessLogicStep(validator: (context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }) : ValidatorBuilder;
  addFinalValidationStep(validator: (context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }) : ValidatorBuilder;
  build(): {
    validate: (context: ValidationContext) => {
      isValid: boolean;
      errors: string[];
      context: ValidationContext;
    };
  };
}

class ContextualToolCallValidatorAdvancedAdvanced implements ValidatorBuilder {
  private preValidators: Array<(context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }> = [];
  private businessValidators: Array<(context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }> = [];
  private finalValidators: Array<(context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }> = [];

  addPreValidationStep(validator: (context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }): ValidatorBuilder {
    this.preValidators.push(validator);
    return this;
  }

  addBusinessLogicStep(validator: (context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }): ValidatorBuilder {
    this.businessValidators.push(validator);
    return this;
  }

  addFinalValidationStep(validator: (context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }): ValidatorBuilder {
    this.finalValidators.push(validator);
    return this;
  }

  build(): {
    validate: (context: ValidationContext) => {
      let currentContext: ValidationContext = {
        history: context.history,
        metadata: { ...context.metadata },
        toolCall: context.toolCall,
      };
      let allErrors: string[] = [];
      let overallValid = true;

      const runValidators = (validators: Array<(context: ValidationContext) => { isValid: boolean; errors: string[]; context: ValidationContext }>): { isValid: boolean; errors: string[]; context: ValidationContext } => {
        let currentRunContext: ValidationContext = {
          history: context.history,
          metadata: { ...context.metadata },
          toolCall: context.toolCall,
        };
        let runErrors: string[] = [];
        let runValid = true;

        for (const validator of validators) {
          const result = validator(currentRunContext);
          if (!result.isValid) {
            runErrors.push(...result.errors);
            runValid = false;
          }
          currentRunContext = result.context;
        }
        return { isValid: runValid, errors: runErrors, context: currentRunContext };
      };

      // 1. Pre-Validation Stage
      let preResult = { isValid: true, errors: [] as string[], context: { history: context.history, metadata: { ...context.metadata }, toolCall: context.toolCall } };
      for (const validator of this.preValidators) {
        const result = validator(preResult.context);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          overallValid = false;
        }
        preResult.context = result.context;
      }

      // 2. Business Logic Stage
      let businessResult = { isValid: true, errors: [] as string[], context: preResult.context };
      for (const validator of this.businessValidators) {
        const result = validator(businessResult.context);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          overallValid = false;
        }
        businessResult.context = result.context;
      }

      // 3. Final Validation Stage
      let finalResult = { isValid: true, errors: [] as string[], context: businessResult.context };
      for (const validator of this.finalValidators) {
        const result = validator(finalResult.context);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          overallValid = false;
        }
        finalResult.context = result.context;
      }

      return {
        isValid: overallValid,
        errors: [...new Set(allErrors)], // Deduplicate errors
        context: finalResult.context,
      };
    }
  }
}

export const createValidator = (): ValidatorBuilder => {
  return new ContextualToolCallValidatorAdvancedAdvanced();
};