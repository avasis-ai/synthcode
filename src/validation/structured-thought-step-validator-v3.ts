import {
  Message,
  ContentBlock,
  ThinkingBlock,
} from "./types";

export enum ThoughtStepType {
  HYPOTHESIS = "HYPOTHESIS",
  EVIDENCE_CHECK = "EVIDENCE_CHECK",
  CONCLUSION_DRAFTING = "CONCLUSION_DRAFTING",
  FINAL_CONCLUSION = "FINAL_CONCLUSION",
}

export interface StructuredThoughtStep {
  type: ThoughtStepType;
  content: string;
}

export interface StructuredThoughtValidator {
  validate(steps: StructuredThoughtStep[]): { isValid: boolean; errors: string[] };
}

export class StructuredThoughtStepValidatorV3 implements StructuredThoughtValidator {
  validate(steps: StructuredThoughtStep[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let expectedStep: ThoughtStepType | null = ThoughtStepType.HYPOTHESIS;

    if (!steps || steps.length === 0) {
      return { isValid: false, errors: ["Thought steps array cannot be empty."] };
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (step.type === ThoughtStepType.HYPOTHESIS) {
        if (i > 0 && expectedStep !== null) {
          errors.push(`Step ${i}: Expected ${expectedStep} but found ${ThoughtStepType[step.type]}. Steps must follow sequence.`);
        }
        expectedStep = ThoughtStepType.EVIDENCE_CHECK;
      } else if (step.type === ThoughtStepType.EVIDENCE_CHECK) {
        if (expectedStep !== ThoughtStepType.HYPOTHESIS) {
          errors.push(`Step ${i}: Expected ${ThoughtStepStepType.EVIDENCE_CHECK} but found ${ThoughtStepType[step.type]}. Must follow HYPOTHESIS.`);
        }
        expectedStep = ThoughtStepType.CONCLUSION_DRAFTING;
      } else if (step.type === ThoughtStepType.CONCLUSION_DRAFTING) {
        if (expectedStep !== ThoughtStepType.EVIDENCE_CHECK) {
          errors.push(`Step ${i}: Expected ${ThoughtStepType.CONCLUSION_DRAFTING} but found ${ThoughtStepType[step.type]}. Must follow EVIDENCE_CHECK.`);
        }
        expectedStep = ThoughtStepType.FINAL_CONCLUSION;
      } else if (step.type === ThoughtStepType.FINAL_CONCLUSION) {
        if (expectedStep !== ThoughtStepType.CONCLUSION_DRAFTING) {
          errors.push(`Step ${i}: Expected ${ThoughtStepType.FINAL_CONCLUSION} but found ${ThoughtStepType[step.type]}. Must follow CONCLUSION_DRAFTING.`);
        }
        // Final step, no expectation after this
        expectedStep = null;
      } else {
        errors.push(`Step ${i}: Unknown thought step type encountered: ${ThoughtStepType[step.type]}.`);
        expectedStep = null;
      }

      // Basic content validation
      if (!step.content || step.content.trim().length < 10) {
        errors.push(`Step ${i} (${ThoughtStepType[step.type]}): Content is too short or empty.`);
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}