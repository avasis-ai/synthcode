import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ThoughtStep = {
  step_type: "goal_analysis" | "planning" | "execution" | "reflection";
  content: Record<string, unknown>;
};

type TransitionRule = {
  from: "goal_analysis" | "planning" | "execution" | "reflection";
  to: "goal_analysis" | "planning" | "execution" | "reflection";
  required_predecessor_step: "goal_analysis" | "planning" | "execution" | "reflection" | null;
  validation_fn: (
    prevStep: ThoughtStep,
    currentStep: ThoughtStep,
  ) => string | null;
};

export class StructuredThoughtStepValidatorV16 {
  private rules: TransitionRule[] = [];

  constructor() {}

  addTransitionRule(
    from: "goal_analysis" | "planning" | "execution" | "reflection",
    to: "goal_analysis" | "planning" | "execution" | "reflection",
    requiredPredecessorStep: "goal_analysis" | "planning" | "execution" | "reflection" | null,
    validationFn: (
      prevStep: ThoughtStep,
      currentStep: ThoughtStep,
    ) => string | null,
  ): this {
    this.rules.push({
      from,
      to,
      required_predecessor_step: requiredPredecessorStep,
      validation_fn: validationFn,
    });
    return this;
  }

  validate(thoughtSteps: ThoughtStep[]): string | null {
    if (!thoughtSteps || thoughtSteps.length < 2) {
      return null;
    }

    for (let i = 1; i < thoughtSteps.length; i++) {
      const currentStep = thoughtSteps[i];
      const prevStep = thoughtSteps[i - 1];

      const matchingRules = this.rules.filter(
        (rule) => rule.from === prevStep.step_type && rule.to === currentStep.step_type,
      );

      for (const rule of matchingRules) {
        // 1. Check required predecessor step
        if (rule.required_predecessor_step) {
          const expectedType = rule.required_predecessor_step;
          if (prevStep.step_type !== expectedType) {
            return `Structural Error: Transition from ${prevStep.step_type} to ${currentStep.step_type} requires the preceding step to be ${expectedType}.`;
          }
        }

        // 2. Run custom validation function
        const validationError = rule.validation_fn(prevStep, currentStep);
        if (validationError) {
          return `Structural Error: Invalid transition from ${prevStep.step_type} to ${currentStep.step_type}. Reason: ${validationError}`;
        }
      }
    }

    return null;
  }
}