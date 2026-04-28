import { EventEmitter } from "events";

export type ValidationContext = {
  input: Record<string, unknown>;
  history: Array<{ role: string; content: unknown }>;
  metadata: Record<string, unknown>;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  context?: Record<string, unknown>;
};

export interface ValidationStep {
  name: string;
  validateSync(context: ValidationContext): ValidationResult;
  validateAsync(context: ValidationContext): Promise<ValidationResult>;
}

export class StructuredToolInputValidationPipelineV35 extends EventEmitter {
  private steps: ValidationStep[] = [];
  private readonly defaultContext: ValidationContext;

  constructor(initialContext: ValidationContext) {
    super();
    this.defaultContext = initialContext;
  }

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  addPipeline(pipeline: StructuredToolInputValidationPipelineV35): this {
    // In a real scenario, this would manage chaining. For simplicity, we append steps.
    pipeline.steps.forEach(step => this.addStep(step));
    return this;
  }

  async validate(context: ValidationContext = this.defaultContext): Promise<ValidationResult> {
    let currentContext = { ...context, input: { ...context.input } };
    let accumulatedResult: ValidationResult = { isValid: true, errors: [], warnings: [] };

    for (const step of this.steps) {
      try {
        const asyncResult = await step.validateAsync(currentContext);
        
        if (!asyncResult.isValid) {
          accumulatedResult.errors.push(...asyncResult.errors);
          accumulatedResult.isValid = false;
        } else {
          accumulatedResult.warnings.push(...asyncResult.warnings);
        }
        
        if (asyncResult.context) {
          currentContext = { ...currentContext, ...asyncResult.context };
        }
      } catch (error) {
        accumulatedResult.errors.push(`Pipeline execution failed at step ${step.name}: ${(error as Error).message}`);
        accumulatedResult.isValid = false;
      }
    }

    return accumulatedResult;
  }
}

export class SchemaValidationStep implements ValidationStep {
  constructor(public name: string, private schema: Record<string, any>) {}

  validateSync(context: ValidationContext): ValidationResult {
    const input = context.input;
    const errors: string[] = [];

    for (const key in this.schema) {
      if (Object.prototype.hasOwnProperty.call(this.schema, key)) {
        const rules = this.schema[key];
        const value = input[key];

        if (rules.required && value === undefined) {
          errors.push(`${key} is required.`);
          continue;
        }

        if (value !== undefined) {
          if (rules.type && typeof value !== rules.type) {
            errors.push(`${key} must be of type ${rules.type}, got ${typeof value}.`);
          }
          // Add more type/format checks here
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  async validateAsync(context: ValidationContext): Promise<ValidationResult> {
    // Simulate async schema validation (e.g., calling a remote validator)
    await new Promise(resolve => setTimeout(resolve, 10)); 
    return this.validateSync(context);
  }
}

export class CrossFieldDependencyStep implements ValidationStep {
  constructor(public name: string, private dependencyCheck: (context: ValidationContext) => { isValid: boolean, message: string }) {}

  validateSync(context: ValidationContext): ValidationResult {
    const { isValid, message } = this.dependencyCheck(context);
    return {
      isValid: isValid,
      errors: !isValid ? [message] : [],
      warnings: [],
    };
  }

  async validateAsync(context: ValidationContext): Promise<ValidationResult> {
    // Complex cross-field logic often requires async context (e.g., checking against a DB)
    await new Promise(resolve => setTimeout(resolve, 15));
    const { isValid, message } = this.dependencyCheck(context);
    return {
      isValid: isValid,
      errors: !isValid ? [message] : [],
      warnings: [],
    };
  }
}

export {
  StructuredToolInputValidationPipelineV35,
  ValidationStep,
  SchemaValidationStep,
  CrossFieldDependencyStep,
  ValidationContext,
  ValidationResult
}