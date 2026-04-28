import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PreconditionValidator {
  validate(context: Record<string, unknown>): ValidationResult;
}

export class PreconditionChain {
  private validators: PreconditionValidator[];

  constructor(validators: PreconditionValidator[]) {
    this.validators = validators;
  }

  public validate(context: Record<string, unknown>): ValidationResult {
    const allErrors: string[] = [];
    let allValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
    };
  }
}

export class SimplePreconditionValidator implements PreconditionValidator {
  private name: string;
  private requiredKey: string;
  private checkFn: (value: unknown) => boolean;
  private errorMessage: string;

  constructor(name: string, requiredKey: string, checkFn: (value: unknown) => boolean, errorMessage: string) {
    this.name = name;
    this.requiredKey = requiredKey;
    this.checkFn = checkFn;
    this.errorMessage = errorMessage;
  }

  public validate(context: Record<string, unknown>): ValidationResult {
    const value = context[this.requiredKey];
    if (value === undefined) {
      return { isValid: false, errors: [`Missing required context key: ${this.requiredKey}. ${this.errorMessage}`] };
    }

    if (!this.checkFn(value)) {
      return { isValid: false, errors: [`Validation failed for ${this.name} using key ${this.requiredKey}. ${this.errorMessage}`] };
    }

    return { isValid: true, errors: [] };
  }
}

export class TimeWindowValidator implements PreconditionValidator {
  private name: string;
  private contextKey: string;
  private windowMs: number;
  private errorMessage: string;

  constructor(name: string, contextKey: string, windowMs: number, errorMessage: string) {
    this.name = name;
    this.contextKey = contextKey;
    this.windowMs = windowMs;
    this.errorMessage = errorMessage;
  }

  public validate(context: Record<string, unknown>): ValidationResult {
    const timestamp = context[this.contextKey];

    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      return { isValid: false, errors: [`Time context key '${this.contextKey}' must be a valid number (timestamp).`] };
    }

    const currentTime = Date.now();
    const timeDifference = Math.abs(currentTime - timestamp);

    if (timeDifference > this.windowMs) {
      return { isValid: false, errors: [`Time precondition failed for ${this.name}. Time difference (${timeDifference}ms) exceeds allowed window (${this.windowMs}ms).`] };
    }

    return { isValid: true, errors: [] };
  }
}