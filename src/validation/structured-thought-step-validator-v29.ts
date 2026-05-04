import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type StepContext = {
  previousStep: Message | null;
  currentStep: Message;
};

export type TransitionRule = (context: StepContext) => boolean;

export class StructuredThoughtStepValidatorV29 {
  private rules: Map<string, TransitionRule> = new Map();

  private constructor() {}

  public static getInstance(): StructuredThoughtStepValidatorV29 {
    if (!StructuredThoughtStepValidatorV29.instance) {
      StructuredThoughtStepValidatorV29.instance = new StructuredThoughtStepValidatorV29();
    }
    return StructuredThoughtStepValidatorV29.instance;
  }

  public registerRule(stepType: string, rule: TransitionRule): StructuredThoughtStepValidatorV29 {
    this.rules.set(stepType, rule);
    return this;
  }

  public validateSequence(steps: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!steps || steps.length < 2) {
      return { isValid: true, errors: [] };
    }

    for (let i = 1; i < steps.length; i++) {
      const previousStep = steps[i - 1];
      const currentStep = steps[i];
      const stepType = this.getStepType(currentStep);

      if (stepType && this.rules.has(stepType)) {
        const rule = this.rules.get(stepType)!;
        const context: StepContext = {
          previousStep: previousStep,
          currentStep: currentStep,
        };

        if (!rule(context)) {
          errors.push(`Validation failed at step ${i} (${stepType}): Transition from previous step to current step violates registered rules.`);
        }
      } else if (!stepType) {
        errors.push(`Could not determine step type for step ${i}.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private getStepType(message: Message): string | null {
    if ("user" === message.role) return "user_message";
    if ("assistant" === message.role) return "assistant_message";
    if ("tool" === message.role) return "tool_result_message";
    return null;
  }

  private static instance: StructuredThoughtStepValidatorV29 | null = null;

  public static get instance(): StructuredThoughtStepValidatorV29 {
    if (!StructuredThoughtStepValidatorV29.instance) {
      StructuredThoughtStepValidatorV29.instance = new StructuredThoughtStepValidatorV29();
    }
    return StructuredThoughtStepValidatorV29.instance;
  }
}