import { describe, it, expect } from "vitest";
import { StateTransitionRule, Precondition } from "../src/validation/contextual-state-transition-validator";

describe("StateTransitionRule", () => {
  it("should correctly validate a transition with all preconditions met", () => {
    const precondition: Precondition = {
      key: "userHasPermission",
      check: (context, message) => context["userHasPermission"] === true,
    };
    const rule: StateTransitionRule = {
      fromState: "A",
      toState: "B",
      requiredPreconditions: [precondition],
    };

    const context: Record<string, unknown> = {
      userHasPermission: true,
    };
    const message = { type: "UserMessage", content: "test" };

    const isValid = rule.requiredPreconditions.every(
      (p) => p.check(context, message)
    );
    expect(isValid).toBe(true);
  });

  it("should fail validation if any precondition is not met", () => {
    const precondition: Precondition = {
      key: "userHasPermission",
      check: (context, message) => context["userHasPermission"] === true,
    };
    const rule: StateTransitionRule = {
      fromState: "A",
      toState: "B",
      requiredPreconditions: [precondition],
    };

    const context: Record<string, unknown> = {
      userHasPermission: false,
    };
    const message = { type: "UserMessage", content: "test" };

    const isValid = rule.requiredPreconditions.every(
      (p) => p.check(context, message)
    );
    expect(isValid).toBe(false);
  });

  it("should pass validation if there are no preconditions defined", () => {
    const rule: StateTransitionRule = {
      fromState: "A",
      toState: "B",
      requiredPreconditions: [],
    };

    const context: Record<string, unknown> = {};
    const message = { type: "UserMessage", content: "test" };

    const isValid = rule.requiredPreconditions.every(
      (p) => p.check(context, message)
    );
    expect(isValid).toBe(true);
  });
});