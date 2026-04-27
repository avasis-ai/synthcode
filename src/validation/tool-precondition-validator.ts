import { Message } from "./message";

export type ValidationResult = {
  isValid: boolean;
  failures: string[];
};

export interface Precondition<TContext> {
  (context: TContext): { isValid: boolean; failureReason?: string };
}

export class ToolPreconditionValidator<TContext> {
  private preconditions: Precondition<TContext>[];

  constructor(preconditions: Precondition<TContext>[]) {
    this.preconditions = preconditions;
  }

  public validate(context: TContext): ValidationResult {
    const failures: string[] = [];
    let allValid = true;

    for (const precondition of this.preconditions) {
      const result = precondition(context);
      if (!result.isValid) {
        failures.push(result.failureReason || "Unknown precondition failure");
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      failures: failures,
    };
  }
}