import { Message, ContentBlock, ThinkingBlock } from "./types";

export type StepValidationRule = (
  previousStep: ThinkingBlock | null,
  currentStep: ThinkingBlock
) => { isValid: boolean; message: string };

export class StructuredThoughtStepValidatorV13 {
  private rules: StepValidationRule[];

  constructor(rules: StepValidationRule[] = []) {
    this.rules = rules;
  }

  public validate(thoughtSteps: ThinkingBlock[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    for (let i = 0; i < thoughtSteps.length; i++) {
      const currentStep = thoughtSteps[i];
      const previousStep = i > 0 ? thoughtSteps[i - 1] : null;

      for (const rule of this.rules) {
        const { isValid: ruleValid, message: ruleMessage } = rule(previousStep, currentStep);
        if (!ruleValid) {
          errors.push(`Step ${i + 1} failed validation: ${ruleMessage}`);
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  }

  public static createDefaultValidator(): StructuredThoughtStepValidatorV13 {
    const defaultRules: StepValidationRule[] = [
      (previousStep, currentStep) => {
        if (!currentStep) {
          return { isValid: false, message: "Current step is missing." };
        }
        if (typeof currentStep.thinking !== 'string' || currentStep.thinking.trim().length === 0) {
          return { isValid: false, message: "Thinking content cannot be empty." };
        }
        return { isValid: true, message: "Basic structure valid." };
      },
      (previousStep, currentStep) => {
        if (previousStep && !currentStep.thinking.includes("address")) {
          return { isValid: false, message: "Step N+1 must explicitly address a point raised in Step N." };
        }
        return { isValid: true, message: "Coherence check passed." };
      },
      (previousStep, currentStep) => {
        if (previousStep && previousStep.thinking.includes("assumption") && !currentStep.thinking.includes("verify")) {
          return { isValid: false, message: "If Step N mentions an assumption, Step N+1 must attempt to verify it." };
        }
        return { isValid: true, message: "Assumption handling check passed." };
      }
    ];

    return new StructuredThoughtStepValidatorV13(defaultRules);
  }
}