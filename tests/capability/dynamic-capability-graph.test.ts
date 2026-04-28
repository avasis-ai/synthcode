import { describe, it, expect } from "vitest";
import {
  CapabilityEdge,
  TransformationContext,
} from "../src/capability/dynamic-capability-graph";

describe("CapabilityEdge", () => {
  it("should correctly create a basic CapabilityEdge", () => {
    const context: TransformationContext = {
      sourceToolId: "toolA",
      sourceCapability: "capA",
      targetToolId: "toolB",
      targetCapability: "capB",
      description: "A to B",
    };
    const edge: CapabilityEdge = {
      sourceCapability: "capA",
      targetCapability: "capB",
      context: context,
    };

    expect(edge.sourceCapability).toBe("capA");
    expect(edge.targetCapability).toBe("capB");
    expect(edge.context).toEqual(context);
  });

  it("should handle different tool IDs in the context", () => {
    const context: TransformationContext = {
      sourceToolId: "tool_123",
      sourceCapability: "capA",
      targetToolId: "tool_xyz",
      targetCapability: "capB",
      description: "Complex path",
    };
    const edge: CapabilityEdge = {
      sourceCapability: "capA",
      targetCapability: "capB",
      context: context,
    };

    expect(edge.context.sourceToolId).toBe("tool_123");
    expect(edge.context.targetToolId).toBe("tool_xyz");
  });

  it("should ensure the context description is preserved", () => {
    const context: TransformationContext = {
      sourceToolId: "toolA",
      sourceCapability: "capA",
      targetToolId: "toolB",
      targetCapability: "capB",
      description: "This is a detailed description.",
    };
    const edge: CapabilityEdge = {
      sourceCapability: "capA",
      targetCapability: "capB",
      context: context,
    };

    expect(edge.context.description).toBe("This is a detailed description.");
  });
});