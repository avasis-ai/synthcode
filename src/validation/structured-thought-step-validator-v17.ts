import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AdvancedValidationRule {
  name: string;
  validate(steps: Message[], currentStepIndex: number, currentStep: Message): { isValid: boolean; message: string };
}

export class StructuredThoughtStepValidatorV17 {
  private rules: AdvancedValidationRule[];

  constructor(rules: AdvancedValidationRule[] = []) {
    this.rules = rules;
  }

  public validate(steps: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let overallValid = true;

    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const precedingSteps = steps.slice(0, i);

      for (const rule of this.rules) {
        const result = rule.validate(steps, i, currentStep);
        if (!result.isValid) {
          errors.push(`Validation failed for step ${i} (${currentStep.role}): ${result.message}`);
          overallValid = false;
        }
      }
    }

    return { isValid: overallValid, errors: errors };
  }

  public addRule(rule: AdvancedValidationRule): this {
    this.rules.push(rule);
    return this;
  }
}