import { Message } from "./types";

export type ValidationResult = {
  success: boolean;
  evidence: Record<string, any>;
  next_steps: {
    action: "continue" | "fail" | "require_input";
    message: string;
    data?: Record<string, any>;
  };
};

export type AdvancedPreconditionStep = (
  context: {
    messages: Message[];
    state: Record<string, any>;
  }
) => Promise<ValidationResult>;

export class AdvancedPreconditionValidator {
  private steps: AdvancedPreconditionStep[];

  constructor() {
    this.steps = [];
  }

  addStep(step: AdvancedPreconditionStep): this {
    this.steps.push(step);
    return this;
  }

  async validate(context: {
    messages: Message[];
    state: Record<string, any>;
  }): Promise<ValidationResult> {
    let currentState: Record<string, any> = { ...context.state };
    let currentContext: {
      messages: Message[];
      state: Record<string, any>;
    } = {
      messages: context.messages,
      state: currentState,
    };

    let lastResult: ValidationResult = {
      success: true,
      evidence: {},
      next_steps: {
        action: "continue",
        message: "All preconditions met.",
      },
    };

    for (const step of this.steps) {
      try {
        const result = await step(currentContext);

        if (!result.success) {
          lastResult = result;
          return result;
        }

        lastResult.evidence = { ...lastResult.evidence, ...result.evidence };
        lastResult.next_steps = result.next_steps;
        currentContext.state = { ...currentContext.state, ...result.evidence };
      } catch (error) {
        return {
          success: false,
          evidence: { error: (error as Error).message },
          next_steps: {
            action: "fail",
            message: `Validation failed due to an internal error: ${(error as Error).message}`,
          },
        };
      }
    }

    return lastResult;
  }
}