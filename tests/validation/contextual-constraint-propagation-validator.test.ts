import { describe, it, expect } from "vitest";
import { ContextualConstraintPropagationValidator } from "../src/validation/contextual-constraint-propagation-validator";

describe("ContextualConstraintPropagationValidator", () => {
  it("should validate correctly when no constraints are present", () => {
    const validator = new ContextualConstraintPropagationValidator({});
    const result = validator.validate({
      context: { user: "test" },
      newConstraints: [],
    });
    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("should detect a violation when a new constraint contradicts the context", () => {
    const validator = new ContextualConstraintPropagationValidator({
      context: { requiredRole: "admin" },
    });
    const result = validator.validate({
      context: { requiredRole: "user" },
      newConstraints: [{ key: "requiredRole", value: "user", scope: "local" }],
    });
    expect(result.isValid).toBe(false);
    expect(result.violations).toContain("Constraint 'requiredRole' value 'user' contradicts context 'admin'");
  });

  it("should pass validation when new constraints are consistent with the context", () => {
    const validator = new ContextualConstraintPropagationValidator({
      context: { requiredRole: "admin" },
    });
    const result = validator.validate({
      context: { requiredRole: "admin" },
      newConstraints: [{ key: "requiredRole", value: "admin", scope: "local" }],
    });
    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
  });
});