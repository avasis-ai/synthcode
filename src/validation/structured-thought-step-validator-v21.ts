import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, any>;
};

export interface ValidatorContext {
  history: Message[];
  stepResults: Record<string, any>;
}

export class StructuredThoughtStepValidatorV21 {
  private context: ValidatorContext;
  private validationRules: Map<string, (context: ValidatorContext, step: any) => string[]>;

  constructor(initialHistory: Message[]) {
    this.context = {
      history: [...initialHistory],
      stepResults: {},
    };
    this.validationRules = new Map();
  }

  private getContext(): ValidatorContext {
    return this.context;
  }

  public addRule(ruleName: string, validator: (context: ValidatorContext, step: any) => string[]): void {
    this.validationRules.set(ruleName, validator);
  }

  public validateStep(step: any): ValidationResult {
    const errors: string[] = [];
    const context = this.getContext();

    // 1. Run all defined cross-step validation rules
    for (const [ruleName, validator] of this.validationRules.entries()) {
      const ruleErrors = validator(context, step);
      if (ruleErrors.length > 0) {
        errors.push(`[Rule: ${ruleName}] ${ruleErrors.join('; ')}`);
      }
    }

    // 2. Perform basic structural validation (placeholder for complex logic)
    if (!step || typeof step !== 'object') {
      errors.push("Step input must be a valid object.");
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...context.stepResults },
    };

    return result;
  }

  public updateContext(stepData: any, result: ValidationResult): void {
    if (result.isValid) {
      // Simulate updating context state based on successful validation
      this.context.stepResults[`step_${Date.now()}`] = stepData;
    }
  }

  /**
   * Defines a cross-step dependency check.
   * Example: Ensures the current step references a specific key from a previous step.
   * @param requiredKey The key expected in the previous step's result.
   * @param stepIdentifier A unique identifier for the current step's context.
   */
  public addCrossStepDependencyCheck(requiredKey: string, stepIdentifier: string): (context: ValidatorContext, step: any) => string[] {
    return (context: ValidatorContext, step: any): string[] => {
      const previousResult = context.stepResults[requiredKey];
      if (!previousResult) {
        return [`Dependency failed: Required key '${requiredKey}' not found in previous context.`];
      }
      // In a real scenario, we would check if 'step' contains a reference to previousResult
      if (typeof step.referenceId !== 'string' || step.referenceId !== requiredKey) {
        return [`Dependency failed: Step ${stepIdentifier} must explicitly reference '${requiredKey}' to validate against previous result.`];
      }
      return [];
    };
  }
}