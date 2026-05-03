import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type SchemaValidator = (data: unknown) => { isValid: boolean; errors: string[] };

export class FallbackValidator {
  private fallbackValidators: SchemaValidator[] = [];

  registerFallbackValidator(validator: SchemaValidator): void {
    this.fallbackValidators.push(validator);
  }

  validate(data: unknown): { isValid: boolean; errors: string[]; fallbackUsed: boolean } {
    for (const validator of this.fallbackValidators) {
      const result = validator(data);
      if (result.isValid) {
        return { isValid: true, errors: [], fallbackUsed: true };
      }
    }
    return { isValid: false, errors: [], fallbackUsed: false };
  }
}

export class ValidationService {
  private fallbackValidator: FallbackValidator;

  constructor() {
    this.fallbackValidator = new FallbackValidator();
  }

  registerFallbackValidator(validator: SchemaValidator): void {
    this.fallbackValidator.registerFallbackValidator(validator);
  }

  public validateToolOutput(data: unknown): { isValid: boolean; errors: string[]; fallbackUsed: boolean } {
    try {
      // Simulate primary validation attempt
      // In a real scenario, this would call the primary, strict validator
      if (typeof data !== 'object' || data === null) {
        throw new Error("Input data is not a valid object.");
      }
      
      // Placeholder for primary validation logic
      const primaryResult: { isValid: boolean; errors: string[] } = { isValid: true, errors: [] }; 
      
      if (!primaryResult.isValid) {
        throw new Error("Primary schema validation failed.");
      }
      
      return { isValid: true, errors: [], fallbackUsed: false };

    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown validation error";
      console.warn(`Primary validation failed (${error}). Attempting fallback validation.`);
      
      return this.fallbackValidator.validate(data);
    }
  }
}