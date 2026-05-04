import { Message, ContentBlock, ThinkingBlock } from "./types";

export interface DependencyRule {
  dependency: "previous_step_output" | "specific_step_output";
  target_step_index: number;
  required_output_key: string;
  checkFn: (
    steps: { step: Message; index: number }[],
    currentStepIndex: number
  ) => boolean;
}

export interface AdvancedValidationRules {
  dependencies: DependencyRule[];
  // Add other cross-step consistency checks here if needed
}

export class StructuredThoughtStepValidatorV2 {
  private rules: AdvancedValidationRules;

  constructor(rules: AdvancedValidationRules) {
    this.rules = rules;
  }

  private validateDependencies(steps: { step: Message; index: number }[]): boolean {
    for (const rule of this.rules.dependencies) {
      const { target_step_index, required_output_key, checkFn } = rule;

      if (target_step_index >= steps.length) {
        console.warn(`Dependency check failed: Target step index ${target_step_index} is out of bounds.`);
        continue;
      }

      const targetStep = steps[target_step_index];
      const isValid = checkFn(steps, target_step_index);

      if (!isValid) {
        console.error(`Cross-step validation failed at index ${target_step_index} due to dependency rule.`);
        return false;
      }
    }
    return true;
  }

  public validate(steps: { step: Message; index: number }[]): boolean {
    if (!steps || steps.length === 0) {
      return true;
    }

    // 1. Basic structural validation (can be expanded)
    // For simplicity, we assume Message type validation is handled elsewhere,
    // but we can check for required fields if Message structure was more complex.

    // 2. Cross-step dependency validation
    const dependenciesValid = this.validateDependencies(steps);

    return dependenciesValid;
  }
}