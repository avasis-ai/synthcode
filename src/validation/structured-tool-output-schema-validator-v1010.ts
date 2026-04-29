import { Message, ToolResultMessage } from "./types";

export interface CrossFieldConstraint {
  /**
   * A unique identifier for the constraint group.
   */
  id: string;
  /**
   * The function that performs the validation logic. It receives the entire
   * structured output object and must return an array of errors (empty array on success).
   * @param data The entire structured tool output object.
   * @returns An array of error strings.
   */
  validate: (data: Record<string, unknown>) => string[];
}

export class StructuredToolOutputSchemaValidatorV1010 {
  private constraints: CrossFieldConstraint[];

  constructor(constraints: CrossFieldConstraint[]) {
    this.constraints = constraints;
  }

  public validate(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    for (const constraint of this.constraints) {
      const errors = constraint.validate(data);
      if (errors.length > 0) {
        allErrors.push(...errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}