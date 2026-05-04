import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationContext {
  history: Message[];
  // Add any other context needed for validation, e.g., schema definitions
}

export interface CrossStepValidator {
  validate(steps: any[], context: ValidationContext): { isValid: boolean; errors: string[] };
}

export class StructuredThoughtStepValidatorV23 implements CrossStepValidator {
  private customValidators: Map<string, (steps: any[], context: ValidationContext) => { isValid: boolean; errors: string[] }>();

  constructor() {
    this.customValidators = new Map();
  }

  registerValidator(name: string, validatorFn: (steps: any[], context: ValidationContext) => { isValid: boolean; errors: string[] }): void {
    this.customValidators.set(name, validatorFn);
  }

  validate(steps: any[], context: ValidationContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let overallValid = true;

    // 1. Basic structural validation (Placeholder for step-by-step checks)
    if (!Array.isArray(steps) || steps.length === 0) {
      errors.push("Thought steps must be a non-empty array.");
      return { isValid: false, errors };
    }

    // 2. Cross-step dependency checking
    for (const [name, validatorFn] of this.customValidators.entries()) {
      const result = validatorFn(steps, context);
      if (!result.isValid) {
        overallValid = false;
        errors.push(...result.errors);
      }
    }

    // 3. Placeholder for sequential dependency checks (e.g., Step N must reference Step N-2)
    for (let i = 1; i < steps.length; i++) {
      const currentStep = steps[i];
      const previousStep = steps[i - 1];

      // Example: Check if the current step references a required output from the previous step
      if (typeof currentStep === 'object' && currentStep !== null && 'references' in currentStep) {
        const requiredRef = (currentStep as any).references;
        if (typeof requiredRef === 'string' && !previousStep?.includes(requiredRef)) {
          errors.push(`Step ${i} references missing data from the immediate previous step.`);
          overallValid = false;
        }
      }
    }

    return {
      isValid: overallValid && errors.length === 0,
      errors: errors
    };
  }
}