import { ToolCall, ToolInvocationContext } from "./types";

export interface Precondition {
  (context: ToolInvocationContext): Promise<boolean> | Promise<Error>;
}

export class ToolCallPreconditionChecker {
  private preconditions: Precondition[];

  constructor(preconditions: Precondition[]) {
    this.preconditions = preconditions;
  }

  public async check(toolCall: ToolCall, context: ToolInvocationContext): Promise<{ success: boolean; errors: Error[] }> {
    const errors: Error[] = [];
    let allPassed = true;

    for (const precondition of this.preconditions) {
      const result = await precondition(context);

      if (result instanceof Error) {
        errors.push(result);
        allPassed = false;
        // Stop early if a critical precondition fails (assuming any error means failure)
        break;
      } else if (typeof result === 'boolean') {
        if (!result) {
          errors.push(new Error("Precondition failed validation."));
          allPassed = false;
          break;
        }
      }
    }

    return { success: allPassed, errors };
  }
}