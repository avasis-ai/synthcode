import { Message, ContentBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface StepValidator {
  validate(
    currentStep: { type: string; content: any },
    previousStep: { type: string; content: any } | null
  ): { isValid: boolean; error?: string };
}

export interface ValidatorRule {
  canValidate(currentStep: { type: string; content: any }, previousStep: { type: string; content: any } | null): boolean;
  validate(currentStep: { type: string; content: any }, previousStep: { type: string; content: any } | null): { isValid: boolean; error?: string };
}

export class StructuredThoughtStepValidatorV4 {
  private rules: ValidatorRule[] = [];

  private constructor() {}

  public static getInstance(): StructuredThoughtStepValidatorV4 {
    if (!StructuredThoughtStepValidatorV4.instance) {
      StructuredThoughtStepValidatorV4.instance = new StructuredThoughtStepValidatorV4();
    }
    return StructuredThoughtStepValidatorV4.instance;
  }

  private static instance: StructuredThoughtStepValidatorV4;

  public addRule(rule: ValidatorRule): StructuredThoughtStepValidatorV4 {
    this.rules.push(rule);
    return this;
  }

  public validateSequence(steps: { type: string; content: any }[]): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const previousStep = i > 0 ? steps[i - 1] : null;

      let stepIsValid = true;
      let stepError: string | undefined = undefined;

      for (const rule of this.rules) {
        if (!rule.canValidate(currentStep, previousStep)) {
          continue;
        }

        const validation = rule.validate(currentStep, previousStep);
        if (!validation.isValid) {
          stepIsValid = false;
          stepError = validation.error || `Validation failed for step ${i}.`;
          break;
        }
      }

      if (!stepIsValid) {
        isValid = false;
        errors.push(`Step ${i} (${currentStep.type}): ${stepError}`);
      }
    }

    return { isValid, errors };
  }
}

export const createRule = (
  check: (current: { type: string; content: any }, previous: { type: string; content: any } | null) => boolean,
  validator: (current: { type: string; content: any }, previous: { type: string; content: any } | null) => { isValid: boolean; error?: string }
): ValidatorRule => ({
  canValidate: check,
  validate: validator,
});

export const buildValidator = (): StructuredThoughtStepValidatorV4 => {
  const validator = StructuredThoughtStepValidatorV4.getInstance();

  // Example Rule 1: Reasoning must follow a Query step
  const queryToReasoningRule: ValidatorRule = createRule(
    (current, previous) => {
      if (current.type === "thinking" && previous && previous.type === "query") {
        return true;
      }
      return false;
    },
    (current, previous) => {
      if (current.type === "thinking" && previous && previous.type === "query") {
        return { isValid: true };
      }
      return { isValid: false, error: "A 'thinking' step must immediately follow a 'query' step." };
    }
  );

  // Example Rule 2: Plan must reference a Goal state (simplified check)
  const planAfterGoalRule: ValidatorRule = createRule(
    (current, previous) => {
      if (current.type === "plan" && previous && previous.type === "goal") {
        return true;
      }
      return false;
    },
    (current, previous) => {
      if (current.type === "plan" && previous && previous.type === "goal") {
        return { isValid: true };
      }
      return { isValid: false, error: "A 'plan' step must follow a 'goal' state definition." };
    }
  );

  validator.addRule(queryToReasoningRule);
  validator.addRule(planAfterGoalRule);

  return validator;
};