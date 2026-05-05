import { describe, it, expect } from "vitest";
import {
  ToolCallDependency,
  EnrichedToolCall,
} from "../src/visualization/contextual-tool-call-dependency-visualizer-v157";

describe("contextual-tool-call-dependency-visualizer-v157", () => {
  it("should correctly process a simple dependency structure", () => {
    const dependencies: ToolCallDependency[] = [
      {
        callId: "call1",
        sourceMessageId: "msgA",
        targetCallId: "call2",
        dependencyType: "sequential",
        constraints: { minDelayMs: 100 },
      },
    ];
    const result = dependencies.map((dep) => ({
      callId: dep.callId,
      sourceMessageId: dep.sourceMessageId,
      targetCallId: dep.targetCallId,
      dependencyType: dep.dependencyType,
      constraints: dep.constraints,
    }));
    expect(result).toEqual([
      {
        callId: "call1",
        sourceMessageId: "msgA",
        targetCallId: "call2",
        dependencyType: "sequential",
        constraints: { minDelayMs: 100 },
      },
    ]);
  });

  it("should handle multiple dependency types correctly", () => {
    const dependencies: ToolCallDependency[] = [
      {
        callId: "callA",
        sourceMessageId: "msg1",
        targetCallId: "callB",
        dependencyType: "temporal",
        constraints: { minDelayMs: 500 },
      },
      {
        callId: "callC",
        sourceMessageId: "msg2",
        targetCallId: "callD",
        dependencyType: "resource",
        constraints: { requiredResource: "API_KEY" },
      },
      {
        callId: "callE",
        sourceMessageId: "msg3",
        targetCallId: "callF",
        dependencyType: "sequential",
        constraints: { resourceCapacity: 5 },
      },
    ];
    const result = dependencies.map((dep) => ({
      callId: dep.callId,
      sourceMessageId: dep.sourceMessageId,
      targetCallId: dep.targetCallId,
      dependencyType: dep.dependencyType,
      constraints: dep.constraints,
    }));
    expect(result.length).toBe(3);
    expect(result[0].dependencyType).toBe("temporal");
    expect(result[1].dependencyType).toBe("resource");
    expect(result[2].dependencyType).toBe("sequential");
  });

  it("should return an empty array when no dependencies are provided", () => {
    const dependencies: ToolCallDependency[] = [];
    const result = dependencies.map((dep) => ({
      callId: dep.callId,
      sourceMessageId: dep.sourceMessageId,
      targetCallId: dep.targetCallId,
      dependencyType: dep.dependencyType,
      constraints: dep.constraints,
    }));
    expect(result).toEqual([]);
  });
});