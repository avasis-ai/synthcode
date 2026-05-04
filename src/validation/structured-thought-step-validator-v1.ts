import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string[]>;
};

export interface ThoughtStep {
  reasoning: string;
  evidence: string[];
  nextStep: {
    action: "continue" | "finish" | "tool_call";
    details: string;
  };
}

export class StructuredThoughtStepValidator {
  validate(step: ThoughtStep): ValidationResult {
    const errors: Record<string, string[]> = {
      reasoning: [],
      evidence: [],
      nextStep: [],
    };

    let isValid = true;

    if (!step.reasoning || typeof step.reasoning !== "string" || step.reasoning.trim().length === 0) {
      errors.reasoning.push("Reasoning must be a non-empty string.");
      isValid = false;
    }

    if (!Array.isArray(step.evidence)) {
      errors.evidence.push("Evidence must be an array.");
      isValid = false;
    } else if (step.evidence.length === 0) {
      errors.evidence.push("Evidence array cannot be empty.");
      isValid = false;
    } else {
      for (const item of step.evidence) {
        if (typeof item !== "string" || item.trim().length === 0) {
          errors.evidence.push("All evidence items must be non-empty strings.");
          break;
        }
      }
    }

    const { nextStep } = step;
    if (!nextStep || typeof nextStep !== "object") {
      errors.nextStep.push("Next step plan object is required.");
      isValid = false;
    } else {
      const validActions: ("continue" | "finish" | "tool_call")[];
      validActions.push("continue", "finish", "tool_call");

      if (!validActions.includes(nextStep.action as any)) {
        errors.nextStep.push(`Action must be one of: ${validActions.join(', ')}.`);
        isValid = false;
      }

      if (typeof nextStep.details !== "string" || nextStep.details.trim().length === 0) {
        errors.nextStep.push("Details must be a non-empty string.");
        isValid = false;
      }
    }

    return {
      isValid: isValid && errors.reasoning.length === 0 && errors.evidence.length === 0 && errors.nextStep.length === 0,
      errors: errors,
    };
  }
}

export const createStructuredThoughtStepValidator = (): StructuredThoughtStepValidator => {
  return new StructuredThoughtStepValidator();
};