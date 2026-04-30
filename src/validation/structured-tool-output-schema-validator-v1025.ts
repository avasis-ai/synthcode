import { Message, ToolResultMessage } from "./types";

export interface CrossStepConstraint {
  validate(history: Message[]): { isValid: boolean; message: string };
}

export class StructuredToolOutputSchemaValidatorV1025 {
  private constraints: CrossStepConstraint[];

  constructor(constraints: CrossStepConstraint[] = []) {
    this.constraints = constraints;
  }

  addConstraint(constraint: CrossStepConstraint): this {
    this.constraints.push(constraint);
    return this;
  }

  validate(history: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const constraint of this.constraints) {
      const result = constraint.validate(history);
      if (!result.isValid) {
        errors.push(result.message);
      }
    }
    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}