import { describe, it, expect } from "vitest";
import { StructuredThoughtChainer } from "../src/thought/structured-thought-chaining-v2";

describe("StructuredThoughtChainer", () => {
  it("should initialize correctly with an empty array of steps", async () => {
    const chainer = new StructuredThoughtChainer([]);
    // Assuming there's a way to check internal state or a method to verify initialization
    // For this test, we'll just ensure instantiation doesn't crash.
    expect(chainer).toBeDefined();
  });

  it("should execute steps sequentially when provided with valid steps", async () => {
    const mockStep1: ThoughtStep = {
      id: "step1",
      description: "First step",
      dependencies: [],
      validationSchema: {},
      execute: async (context) => ({ result: "result1", contextUpdate: { data1: "updated1" } }),
    };
    const mockStep2: ThoughtStep = {
      id: "step2",
      description: "Second step",
      dependencies: ["step1"],
      validationSchema: {},
      execute: async (context) => ({ result: "result2", contextUpdate: { data2: "updated2" } }),
    };

    const chainer = new StructuredThoughtChainer([mockStep1, mockStep2]);
    const initialContext: Record<string, any> = { initial: true };

    const result = await chainer.run(initialContext);

    expect(result.finalResult).toBe("result2");
    // Check if context was updated by both steps (assuming run updates context)
    expect(result.finalContext).toEqual({
      initial: true,
      data1: "updated1",
      data2: "updated2",
    });
  });

  it("should handle steps with dependencies correctly (skipping if dependencies are missing)", async () => {
    const mockStep1: ThoughtStep = {
      id: "step1",
      description: "Step 1",
      dependencies: [],
      validationSchema: {},
      execute: async (context) => ({ result: "result1", contextUpdate: { data1: "updated1" } }),
    };
    const mockStep2: ThoughtStep = {
      id: "step2",
      description: "Step 2 (Depends on step1)",
      dependencies: ["step1"],
      validationSchema: {},
      execute: async (context) => ({ result: "result2", contextUpdate: { data2: "updated2" } }),
    };
    const mockStep3: ThoughtStep = {
      id: "step3",
      description: "Step 3 (Depends on missing_step)",
      dependencies: ["missing_step"],
      validationSchema: {},
      execute: async (context) => ({ result: "result3", contextUpdate: { data3: "updated3" } }),
    };

    // Order: step1 -> step2 -> step3 (step3 should be skipped)
    const chainer = new StructuredThoughtChainer([mockStep1, mockStep2, mockStep3]);
    const initialContext: Record<string, any> = {};

    const result = await chainer.run(initialContext);

    // Only step1 and step2 should run
    expect(result.finalResult).toBe("result2");
    expect(Object.keys(result.finalContext)).toHaveLength(2); // Only data1 and data2 should be present
  });
});