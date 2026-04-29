import { describe, it, expect } from "vitest";
import { GraphPayload } from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v153";

describe("GraphPayload", () => {
  it("should correctly structure a basic payload with tools and resource constraints", () => {
    const payload: GraphPayload = {
      tools: ["toolA", "toolB", "toolC"],
      resourceConstraints: [
        {
          resource: "API_KEY",
          requiredBy: "toolA",
          conflictsWith: "toolB",
          severity: "high",
        },
      ],
    };
    expect(payload.tools).toEqual(["toolA", "toolB", "toolC"]);
    expect(payload.resourceConstraints).toHaveLength(1);
    expect(payload.resourceConstraints![0].resource).toBe("API_KEY");
    expect(payload.resourceConstraints![0].severity).toBe("high");
  });

  it("should handle an empty payload gracefully", () => {
    const payload: GraphPayload = {
      tools: [],
      resourceConstraints: [],
    };
    expect(payload.tools).toEqual([]);
    expect(payload.resourceConstraints).toHaveLength(0);
  });

  it("should correctly include temporal constraints when present", () => {
    const payload: GraphPayload = {
      tools: ["toolX", "toolY"],
      resourceConstraints: [],
      temporalConstraints: [
        {
          toolA: "toolX",
          toolB: "toolY",
          overlapDurationMs: 500,
          dependencyType: "precedes",
        },
      ],
    };
    expect(payload.tools).toEqual(["toolX", "toolY"]);
    expect(payload.temporalConstraints).toHaveLength(1);
    expect(payload.temporalConstraints![0].dependencyType).toBe("precedes");
  });
});