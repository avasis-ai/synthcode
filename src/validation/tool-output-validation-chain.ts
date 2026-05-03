import { Message } from "./message-types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context?: Record<string, any>;
}

export interface ValidationStep {
  validate(output: any, context: Record<string, any>): ValidationResult;
}

export class ToolOutputValidationChain {
  private steps: ValidationStep[];

  private constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public static create(steps: ValidationStep[]): ToolOutputValidationChain {
    return new ToolOutputValidationChain(steps);
  }

  public validate(output: any, initialContext: Record<string, any> = {}): ValidationResult {
    let currentContext: Record<string, any> = { ...initialContext };
    let aggregateResult: ValidationResult = {
      isValid: true,
      errors: [],
      context: { ...initialContext },
    };

    for (const step of this.steps) {
      const result = step.validate(output, currentContext);

      if (!result.isValid) {
        aggregateResult.isValid = false;
        aggregateResult.errors.push(...result.errors);
      } else {
        // Update context with the result of the successful step
        if (result.context) {
          currentContext = { ...currentContext, ...result.context };
        }
      }
    }

    aggregateResult.context = currentContext;
    return aggregateResult;
  }
}

export class SchemaValidationStep implements ValidationStep {
  private schema: Record<string, any>;

  constructor(schema: Record<string, any>) {
    this.schema = schema;
  }

  public validate(output: any, context: Record<string, any>): ValidationResult {
    // Simplified JSON schema validation placeholder
    const isValid = this.isValidAgainstSchema(output, this.schema);
    const errors: string[] = isValid ? [] : ["Schema validation failed against provided structure."];

    return {
      isValid: isValid,
      errors: errors,
      context: { ...context, schema_validated: isValid },
    };
  }

  private isValidAgainstSchema(output: any, schema: Record<string, any>): boolean {
    // In a real implementation, this would use a library like ajv
    if (!schema || typeof schema !== 'object') return true;
    if (typeof output !== 'object' || output === null) return false;

    // Basic check: ensure all required fields in schema exist in output
    const requiredProps = schema.required || [];
    for (const prop of requiredProps) {
      if (!(prop in output)) {
        return false;
      }
    }
    return true;
  }
}

export class SemanticDriftStep implements ValidationStep {
  private readonly allowedKeywords: Set<string>;

  constructor(allowedKeywords: string[]) {
    this.allowedKeywords = new Set(allowedKeywords);
  }

  public validate(output: any, context: Record<string, any>): ValidationResult {
    if (typeof output !== 'object' || output === null) {
      return { isValid: false, errors: ["Output must be a non-null object."], context: { ...context } };
    }

    const keys = Object.keys(output);
    const unexpectedKeys: string[] = [];

    for (const key of keys) {
      if (!this.allowedKeywords.has(key)) {
        unexpectedKeys.push(key);
      }
    }

    const errors: string[] = unexpectedKeys.length > 0
      ? [`Unexpected keys found: ${unexpectedKeys.join(', ')}. Only ${Array.from(this.allowedKeywords).join(', ')} are allowed.`]
      : [];

    return {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...context, drift_checked: errors.length === 0 },
    };
  }
}

export class BusinessLogicStep implements ValidationStep {
  private readonly logic: (output: any, context: Record<string, any>) => { isValid: boolean; errors: string[]; context?: Record<string, any> };

  constructor(logic: (output: any, context: Record<string, any>) => { isValid: boolean; errors: string[]; context?: Record<string, any> }) {
    this.logic = logic;
  }

  public validate(output: any, context: Record<string, any>): ValidationResult {
    const result = this.logic(output, context);
    return {
      isValid: result.isValid,
      errors: result.errors,
      context: result.context ? { ...context, ...result.context } : { ...context },
    };
  }
}