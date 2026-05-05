import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ThoughtStep = Message;

export interface CrossStepConstraint {
  validate: (
    previousStep: ThoughtStep,
    currentStep: ThoughtStep
  ) => { isValid: boolean; message: string };
}

export class StructuredThoughtStepValidatorV30 {
  private constraints: CrossStepConstraint[] = [];

  private constructor() {}

  public static getInstance(): StructuredThoughtStepValidatorV30 {
    if (!StructuredThoughtStepValidatorV30.instance) {
      StructuredThoughtStepValidatorV30.instance = new StructuredThoughtStepValidatorV30();
    }
    return StructuredThoughtStepValidatorV30.instance;
  }

  public addConstraint(constraint: CrossStepConstraint): this {
    this.constraints.push(constraint);
    return this;
  }

  public validateSequence(steps: ThoughtStep[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (!steps || steps.length < 2) {
      return { isValid: true, errors: [] };
    }

    for (let i = 1; i < steps.length; i++) {
      const previousStep = steps[i - 1];
      const currentStep = steps[i];

      for (const constraint of this.constraints) {
        const result = constraint.validate(previousStep, currentStep);
        if (!result.isValid) {
          errors.push(`Constraint failed between Step ${i-1} and Step ${i}: ${result.message}`);
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }

  public static get instance(): StructuredThoughtStepValidatorV30 {
    if (!StructuredThoughtStepValidatorV30.instance) {
      StructuredThoughtStepValidatorV30.instance = new StructuredThoughtStepValidatorV30();
    }
    return StructuredThoughtStepValidatorV30.instance;
  }

  private static instance: StructuredThoughtStepValidatorV30;
}