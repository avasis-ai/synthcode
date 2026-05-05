import { ValidatorBase } from "./validator-base";
import { StructuredThoughtStep } from "./structured-thought-step";

export interface AdvancedValidationRule {
  validate(step: StructuredThoughtStep, context: StructuredThoughtStep[]): { isValid: boolean; message: string };
}

export class StructuredThoughtStepValidatorV21Advanced extends ValidatorBase {
  private rules: AdvancedValidationRule[];

  constructor() {
    super("structured-thought-step-validator-v21-advanced");
    this.rules = [];
  }

  addRule(rule: AdvancedValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(step: StructuredThoughtStep, context: StructuredThoughtStep[]): { isValid: boolean; message: string } {
    for (const rule of this.rules) {
      const result = rule.validate(step, context);
      if (!result.isValid) {
        return { isValid: false, message: result.message };
      }
    }
    return { isValid: true, message: "Validation successful" };
  }
}

export class TemporalOrderingRule implements AdvancedValidationRule {
  validate(step: StructuredThoughtStep, context: StructuredThoughtStep[]): { isValid: boolean; message: string } {
    if (context.length === 0) {
      return { isValid: true, message: "No preceding context to check temporal order." };
    }

    const lastStep = context[context.length - 1];

    if (step.type === "tool_result" && lastStep.type !== "tool_use") {
      return { isValid: false, message: "Tool result must immediately follow a tool use step." };
    }

    if (step.type === "tool_use" && lastStep.type === "tool_use") {
      return { isValid: false, message: "Tool use must be separated by a thought step or direct response." };
    }

    return { isValid: true, message: "Temporal ordering is valid." };
  }
}

export class DependencyCheckRule implements AdvancedValidationRule {
  private requiredDependencies: Map<string, string[]> = new Map();

  addDependency(stepType: string, requiredStepTypes: string[]): this {
    this.requiredDependencies.set(stepType, requiredStepTypes);
    return this;
  }

  validate(step: StructuredThoughtStep, context: StructuredThoughtStep[]): { isValid: boolean; message: string } {
    const required = this.requiredDependencies.get(step.type);
    if (!required || required.length === 0) {
      return { isValid: true, message: "No specific dependencies defined for this step type." };
    }

    const foundDependencies = context.filter(contextStep => required.includes(contextStep.type));

    if (foundDependencies.length < required.length) {
      return { isValid: false, message: `Missing required preceding steps of types: ${required.join(', ')}. Found only ${foundDependencies.length} relevant steps.` };
    }

    return { isValid: true, message: "All required dependencies are met." };
  }
}

export const createAdvancedValidator = (): StructuredThoughtStepValidatorV21Advanced => {
  const validator = new StructuredThoughtStepValidatorV21Advanced();

  // Example: Enforce that a 'final_answer' step must be preceded by a 'thinking' step.
  validator.addRule(new DependencyCheckRule()
    .addDependency("final_answer", ["thinking"])
  );

  // Example: Enforce temporal flow
  validator.addRule(new TemporalOrderingRule());

  return validator;
};