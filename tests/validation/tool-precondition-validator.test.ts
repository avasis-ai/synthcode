import { describe, it, expect } from "vitest";
import { ToolPreconditionValidator, Precondition } from "../src/validation/tool-precondition-validator";

describe("ToolPreconditionValidator", () => {
  it("should return isValid: true and empty failures when all preconditions pass", () => {
    const mockContext = { user: "testUser", role: "admin" };
    const precondition1: Precondition<typeof mockContext> = (context) => {
      if (context.user && context.user.length > 0) {
        return { isValid: true };
      }
      return { isValid: false, failureReason: "User must be set" };
    };
    const precondition2: Precondition<typeof mockContext> = (context) => {
      if (context.role === "admin") {
        return { isValid: true };
      }
      return { isValid: false, failureReason: "Must be admin" };
    };

    const validator = new ToolPreconditionValidator([precondition1, precondition2]);
    const result = validator.validate(mockContext);

    expect(result.isValid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("should collect all failure reasons when multiple preconditions fail", () => {
    const mockContext = { user: "", role: "guest" };
    const precondition1: Precondition<typeof mockContext> = (context) => {
      if (context.user && context.user.length > 0) {
        return { isValid: true };
      }
      return { isValid: false, failureReason: "User must be set" };
    };
    const precondition2: Precondition<typeof mockContext> = (context) => {
      if (context.role === "admin") {
        return { isValid: true };
      }
      return { isValid: false, failureReason: "Must be admin" };
    };

    const validator = new ToolPreconditionValidator([precondition1, precondition2]);
    const result = validator.validate(mockContext);

    expect(result.isValid).toBe(false);
    expect(result.failures).toEqual(["User must be set", "Must be admin"]);
  });

  it("should handle an empty list of preconditions gracefully", () => {
    const mockContext = {};
    const validator = new ToolPreconditionValidator([]);
    const result = validator.validate(mockContext);

    expect(result.isValid).toBe(true);
    expect(result.failures).toEqual([]);
  });
});