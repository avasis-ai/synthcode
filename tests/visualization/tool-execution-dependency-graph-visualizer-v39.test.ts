import { describe, it, expect } from "vitest";
import {
  DependencyEdge,
  TemporalMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v39";

describe("DependencyEdge", () => {
  it("should correctly create a basic dependency edge", () => {
    const edge: DependencyEdge = {
      sourceMessageId: "msg1",
      targetMessageId: "msg2",
    };
    expect(edge.sourceMessageId).toBe("msg1");
    expect(edge.targetMessageId).toBe("msg2");
  });

  it("should correctly create a dependency edge with temporal metadata", () => {
    const metadata: TemporalMetadata = {
      startTime: 1000,
      endTime: 2000,
      durationMs: 1000,
    };
    const edge: DependencyEdge = {
      sourceMessageId: "msgA",
      targetMessageId: "msgB",
      temporalMetadata: metadata,
    };
    expect(edge.sourceMessageId).toBe("msgA");
    expect(edge.targetMessageId).toBe("msgB");
    expect(edge.temporalMetadata).toEqual(metadata);
  });

  it("should handle edges where temporal metadata is undefined", () => {
    const edge: DependencyEdge = {
      sourceMessageId: "msgX",
      targetMessageId: "msgY",
    };
    expect(edge.sourceMessageId).toBe("msgX");
    expect(edge.targetMessageId).toBe("msgY");
    expect(edge.temporalMetadata).toBeUndefined();
  });
});