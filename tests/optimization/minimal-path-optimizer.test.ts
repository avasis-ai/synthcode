import { describe, it, expect } from "vitest";
import { MinimalPathOptimizer } from "../src/optimization/minimal-path-optimizer";

describe("MinimalPathOptimizer", () => {
  const optimizer = new MinimalPathOptimizer();

  it("should return an empty array when given null or empty trace", () => {
    expect(optimizer.optimize(null as any)).toEqual([]);
    expect(optimizer.optimize([])).toEqual([]);
  });

  it("should keep all messages when all messages are essential", () => {
    const trace: any[] = [
      { type: "Message", content: "A" },
      { type: "Message", content: "B" },
      { type: "Message", content: "C" },
    ];
    // Assuming isEssentialMessage always returns true for this simple case
    // Since we cannot fully test the internal logic without the full implementation,
    // we test the expected behavior for a non-optimized path.
    const result = optimizer.optimize(trace);
    expect(result.length).toBe(3);
    expect(result).toEqual(trace);
  });

  it("should remove redundant messages when a clear pattern exists (e.g., consecutive thinking/tool use)", () => {
    // Mocking a scenario where the optimizer should prune intermediate steps
    const trace: any[] = [
      { type: "Message", content: "Start" },
      { type: "ThinkingBlock", content: "Step 1" },
      { type: "ThinkingBlock", content: "Step 2" }, // Redundant
      { type: "ToolUseBlock", content: "Tool Call" },
      { type: "Message", content: "End" },
    ];
    // We expect the optimizer to keep the start, the tool call, and the end,
    // potentially keeping only the first thinking block if it's necessary.
    const result = optimizer.optimize(trace);
    expect(result.length).toBeLessThan(trace.length);
    expect(result).toContainEqual(trace[0]);
    expect(result).toContainEqual(trace[3]);
    expect(result).toContainEqual(trace[4]);
  });
});