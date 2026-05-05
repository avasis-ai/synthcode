import { describe, it, expect } from "vitest";
import {
  AdvancedToolCallContext,
  ResourceConstraint,
  TemporalMetadata,
} from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v156-advanced-advanced";

describe("AdvancedToolCallContext", () => {
  it("should correctly structure a basic resource constraint", () => {
    const constraint: ResourceConstraint = {
      resourceName: "CPU",
      requiredAmount: 1.5,
      unit: "CPU",
    };
    expect(constraint.resourceName).toBe("CPU");
    expect(constraint.requiredAmount).toBe(1.5);
    expect(constraint.unit).toBe("CPU");
  });

  it("should correctly structure temporal metadata", () => {
    const metadata: TemporalMetadata = {
      startTimeMs: 1678886400000,
      endTimeMs: 1678886460000,
      durationMs: 60000,
    };
    expect(metadata.startTimeMs).toBe(1678886400000);
    expect(metadata.endTimeMs).toBe(1678886460000);
    expect(metadata.durationMs).toBe(60000);
  });

  it("should correctly structure an AdvancedToolCallContext", () => {
    const context: AdvancedToolCallContext = {
      toolUseId: "tool-call-123",
      resourceConstraints: [
        {
          resourceName: "Memory",
          requiredAmount: 2048,
          unit: "Memory",
        },
      ],
    };
    expect(context.toolUseId).toBe("tool-call-123");
    expect(context.resourceConstraints).toHaveLength(1);
    expect(context.resourceConstraints[0].resourceName).toBe("Memory");
  });
});