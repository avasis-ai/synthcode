import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export type StepType = "user" | "assistant" | "tool";

export interface StepValidationRule {
  // Condition to check if this rule applies to the current step index (i)
  condition?: (index: number, steps: Message[]): boolean;
  // The validation logic itself. Receives the current step, the full sequence, and the index.
  validate: (step: Message, allSteps: Message[], index: number) => { isValid: boolean; message?: string };
}

export interface StepValidatorConfig {
  requiredStepTypes: StepType[];
  rules: StepValidationRule[];
}

export class StructuredThoughtStepValidator {
  private readonly config: StepValidatorConfig;

  private constructor(config: StepValidatorConfig) {
    this.config = config;
  }

  public static create(config: StepValidatorConfig): StructuredThoughtStepValidator {
    return new StructuredThoughtStepValidator(config);
  }

  public validate(steps: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    // 1. Check for required step types presence (simplified check for demonstration)
    const actualStepTypes: StepType[] = steps.map(step => {
      if (step.role === "user") return "user";
      if (step.role === "assistant") return "assistant";
      if (step.role === "tool") return "tool";
      return "unknown";
    }).filter(type => type !== "unknown");

    const missingTypes: string[] = this.config.requiredStepTypes.filter(
      requiredType => !actualStepTypes.includes(requiredType)
    );

    if (missingTypes.length > 0) {
      errors.push(`Missing required step types: ${missingTypes.join(', ')}`);
      isValid = false;
    }

    // 2. Apply custom cross-step validation rules
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const allSteps = steps;

      for (const rule of this.config.rules) {
        if (rule.condition && !rule.condition(i, allSteps)) {
          continue;
        }

        const validationResult = rule.validate(currentStep, allSteps, i);
        if (!validationResult.isValid) {
          errors.push(`Validation failed at step ${i} (${currentStep.role}): ${validationResult.message || "Unknown structural error"}`);
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }
}

export class ValidatorBuilder {
  private requiredStepTypes: Set<StepType> = new Set();
  private rules: StepValidationRule[] = [];

  public withRequiredStepTypes(types: StepType[]): this {
    types.forEach(type => this.requiredStepTypes.add(type));
    return this;
  }

  public addRule(rule: StepValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  public build(): StructuredThoughtStepValidator {
    const config: StepValidatorConfig = {
      requiredStepTypes: Array.from(this.requiredStepTypes),
      rules: this.rules,
    };
    return StructuredThoughtStepValidator.create(config);
  }
}