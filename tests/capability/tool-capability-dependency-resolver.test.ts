import { describe, it, expect } from "vitest";
import { ToolCapabilityDependencyResolver } from "../src/capability/tool-capability-dependency-resolver";

describe("ToolCapabilityDependencyResolver", () => {
  it("should correctly resolve dependencies for a simple capability", () => {
    const resolver = new ToolCapabilityDependencyResolver();
    const capabilities = {
      "A": {
        name: "A",
        version: "1.0",
        description: "Capability A",
        prerequisites: [],
        inputSchema: {},
        outputSchema: {},
      },
      "B": {
        name: "B",
        version: "1.0",
        description: "Capability B",
        prerequisites: ["A"],
        inputSchema: {},
        outputSchema: {},
      },
    };
    resolver.setCapabilities(capabilities);
    const dependencies = resolver.resolveDependencies("B");
    expect(dependencies).toEqual(["A"]);
  });

  it("should handle multiple, non-linear dependencies", () => {
    const resolver = new ToolCapabilityDependencyResolver();
    const capabilities = {
      "Core": {
        name: "Core",
        version: "1.0",
        description: "Core capability",
        prerequisites: [],
        inputSchema: {},
        outputSchema: {},
      },
      "FeatureX": {
        name: "FeatureX",
        version: "1.0",
        description: "Feature X",
        prerequisites: ["Core"],
        inputSchema: {},
        outputSchema: {},
      },
      "FeatureY": {
        name: "FeatureY",
        version: "1.0",
        description: "Feature Y",
        prerequisites: ["Core"],
        inputSchema: {},
        outputSchema: {},
      },
      "Final": {
        name: "Final",
        version: "1.0",
        description: "Final feature",
        prerequisites: ["FeatureX", "FeatureY"],
        inputSchema: {},
        outputSchema: {},
      },
    };
    resolver.setCapabilities(capabilities);
    const dependencies = resolver.resolveDependencies("Final");
    // The order might vary, so we check for set equality of required nodes
    expect(dependencies.length).toBe(3);
    expect(new Set(dependencies)).toEqual(new Set(["Core", "FeatureX", "FeatureY"]));
  });

  it("should return an empty array if the capability has no prerequisites", () => {
    const resolver = new ToolCapabilityDependencyResolver();
    const capabilities = {
      "Standalone": {
        name: "Standalone",
        version: "1.0",
        description: "Standalone",
        prerequisites: [],
        inputSchema: {},
        outputSchema: {},
      },
    };
    resolver.setCapabilities(capabilities);
    const dependencies = resolver.resolveDependencies("Standalone");
    expect(dependencies).toEqual([]);
  });
});