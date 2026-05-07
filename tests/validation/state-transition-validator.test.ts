import { describe, it, expect } from "vitest";
import { TransitionError } from "../src/validation/state-transition-validator";

describe("TransitionError", () => {
  it("should correctly initialize with a message and report", () => {
    const mockReport = {
      isValid: false,
      errors: ["Invalid transition"],
      warnings: [],
      details: {},
    };
    const errorMessage = "Transition failed";
    const error = new TransitionError(errorMessage, mockReport);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TransitionError);
    expect(error.message).toBe(errorMessage);
    expect(error.report).toBe(mockReport);
  });

  it("should handle a valid transition report correctly", () => {
    const mockReport = {
      isValid: true,
      errors: [],
      warnings: ["Deprecation warning"],
      details: {
        newState: "Success",
      },
    };
    const error = new TransitionError("Transition completed", mockReport);

    expect(error.report.isValid).toBe(true);
    expect(error.report.errors).toEqual([]);
  });

  it("should correctly report multiple errors and warnings", () => {
    const mockReport = {
      isValid: false,
      errors: ["Error A", "Error B"],
      warnings: ["Warning X", "Warning Y"],
      details: {
        reason: "Multiple issues",
      },
    };
    const error = new TransitionError("Transition failed due to multiple issues", mockReport);

    expect(error.report.errors).toHaveLength(2);
    expect(error.report.warnings).toHaveLength(2);
    expect(error.report.isValid).toBe(false);
  });
});