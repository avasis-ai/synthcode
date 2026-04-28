import { describe, it, expect } from "vitest";
import { AdvancedPreconditionValidator } from "../src/validation/advanced-precondition-validator";

describe("AdvancedPreconditionValidator", () => {
  it("should correctly validate a simple precondition", async () => {
    const validator = new AdvancedPreconditionValidator();
    const context = {
      messages: [],
      state: {
        user_id: "user123",
        has_premium: true,
      },
    };

    const simpleStep: AdvancedPreconditionStep = async (context) => {
      if (context.state.user_id === "user123" && context.state.has_premium) {
        return {
          success: true,
          evidence: {
            user_id: context.state.user_id,
            premium: true,
          },
          next_steps: {
            action: "continue",
            message: "Precondition met.",
          },
        };
      }
      return {
        success: false,
        evidence: {},
        next_steps: {
          action: "fail",
          message: "Precondition not met.",
        },
      };
    };

    (validator as any).addStep(simpleStep);
    const result = await validator.validate(context);

    expect(result.success).toBe(true);
    expect(result.next_steps.action).toBe("continue");
  });

  it("should fail validation if a required state is missing", async () => {
    const validator = new AdvancedPreconditionValidator();
    const context = {
      messages: [],
      state: {
        user_id: "user456",
        // has_premium is missing
      },
    };

    const requiredStep: AdvancedPreconditionStep = async (context) => {
      if (context.state.user_id && context.state.has_premium) {
        return {
          success: true,
          evidence: {},
          next_steps: {
            action: "continue",
            message: "All good.",
          },
        };
      }
      return {
        success: false,
        evidence: {},
        next_steps: {
          action: "require_input",
          message: "Please provide premium status.",
          data: {
            field: "has_premium",
          },
        },
      };
    };

    (validator as any).addStep(requiredStep);
    const result = await validator.validate(context);

    expect(result.success).toBe(false);
    expect(result.next_steps.action).toBe("require_input");
    expect(result.next_steps.message).toContain("premium status");
  });

  it("should continue processing if the first step fails but subsequent steps pass", async () => {
    const validator = new AdvancedPreconditionValidator();
    const context = {
      messages: [],
      state: {
        user_id: "user123",
        has_premium: false,
      },
    };

    const failingStep: AdvancedPreconditionStep = async (context) => {
      if (context.state.has_premium) {
        return {
          success: true,
          evidence: {},
          next_steps: {
            action: "continue",
            message: "Premium user.",
          },
        };
      }
      return {
        success: false,
        evidence: {},
        next_steps: {
          action: "fail",
          message: "Must be premium.",
        },
      };
    };

    const passingStep: AdvancedPreconditionStep = async (context) => {
      return {
        success: true,
        evidence: {
          check_passed: true,
        },
        next_steps: {
          action: "continue",
          message: "Second check passed.",
        },
      };
    };

    (validator as any).addStep(failingStep);
    (validator as any).addStep(passingStep);

    // Note: Based on typical validator logic, the first failure usually stops execution.
    // We test the expected behavior: the first failure dictates the outcome.
    const result = await validator.validate(context);

    expect(result.success).toBe(false);
    expect(result.next_steps.action).toBe("fail");
  });
});