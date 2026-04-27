import { describe, it, expect } from "vitest";
import { ToolCapabilityRegistry } from "../src/capability/tool-capability-registry";

describe("ToolCapabilityRegistry", () => {
  it("should initialize with an empty registry", () => {
    const registry = new ToolCapabilityRegistry();
    expect(registry.getCapabilities()).toEqual({});
  });

  it("should add and retrieve a capability by name", () => {
    const registry = new ToolCapabilityRegistry();
    const mockCapability = {
      description: "Test capability",
      requiredContext: [],
      potentialSideEffects: [],
      outputGuarantees: {
        schema: "{}",
        description: "Test output",
      },
    };
    registry.addCapability("test_tool", mockCapability);
    expect(registry.getCapability("test_tool")).toEqual(mockCapability);
  });

  it("should overwrite an existing capability with the same name", () => {
    const registry = new ToolCapabilityRegistry();
    const initialCapability = {
      description: "Initial",
      requiredContext: [],
      potentialSideEffects: [],
      outputGuarantees: {
        schema: "{}",
        description: "Initial output",
      },
    };
    const updatedCapability = {
      description: "Updated",
      requiredContext: [],
      potentialSideEffects: [],
      outputGuarantees: {
        schema: "{}",
        description: "Updated output",
      },
    };
    registry.addCapability("test_tool", initialCapability);
    registry.addCapability("test_tool", updatedCapability);
    expect(registry.getCapability("test_tool")).toEqual(updatedCapability);
  });
});