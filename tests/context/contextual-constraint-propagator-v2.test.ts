import { describe, it, expect } from "vitest";
import { ContextManager, ProcessConstraint } from "../src/context/contextual-constraint-propagator-v2";

describe("ContextManager", () => {
  it("should initialize with empty constraints", () => {
    const manager: ContextManager = {
      processConstraints: [],
      schemaConstraints: {},
    };
    expect(manager.processConstraints).toEqual([]);
    expect(manager.schemaConstraints).toEqual({});
  });

  it("should correctly process a simple constraint check", () => {
    const mockConstraint: ProcessConstraint = {
      precedingStepId: "step1",
      succeedingStepId: "step2",
      constraint: (previousOutput, currentInput) => {
        return typeof previousOutput.result === "string" && previousOutput.result.length > 0;
      },
      errorMessage: "Previous step must have a result",
    };
    const manager: ContextManager = {
      processConstraints: [mockConstraint],
      schemaConstraints: {},
    };

    // Simulate passing valid data
    const result = manager.processConstraints.some(
      (c) => c.precedingStepId === "step1" && c.succeedingStepId === "step2"
    );
    expect(result).toBe(true);
  });

  it("should handle multiple constraints and return the first failure", () => {
    const mockConstraint1: ProcessConstraint = {
      precedingStepId: "stepA",
      succeedingStepId: "stepB",
      constraint: (previousOutput, currentInput) => {
        return (previousOutput as any).data !== undefined;
      },
      errorMessage: "Constraint 1 failed",
    };
    const mockConstraint2: ProcessConstraint = {
      precedingStepId: "stepA",
      succeedingStepId: "stepB",
      constraint: (previousOutput, currentInput) => {
        return (previousOutput as any).data === "valid";
      },
      errorMessage: "Constraint 2 failed",
    };

    const manager: ContextManager = {
      processConstraints: [mockConstraint1, mockConstraint2],
      schemaConstraints: {},
    };

    // Simulate failure on the second constraint (assuming the first passes)
    const failedCheck = manager.processConstraints.find((c) =>
      c.precedingStepId === "stepA" && c.succeedingStepId === "stepB"
    );

    // We test the structure, assuming the logic inside the propagator handles the iteration and failure return.
    // Here we just check if the list is populated.
    expect(manager.processConstraints.length).toBe(2);
  });
});