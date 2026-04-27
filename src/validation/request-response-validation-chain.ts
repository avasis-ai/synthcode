import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type ValidationError = {
  stepName: string;
  message: string;
  details?: any;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

export type ValidationContext = {
  request: any;
  response: any;
  context: Record<string, any>;
};

export type ValidationStep = (context: ValidationContext) => ValidationResult;

export class RequestResponseValidatorChain {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(request: any, response: any, context: Record<string, any>): ValidationResult {
    const validationContext: ValidationContext = {
      request,
      response,
      context,
    };

    const allErrors: ValidationError[] = [];

    for (const step of this.steps) {
      const result = step(validationContext);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}