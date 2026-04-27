import { describe, it, expect } from "vitest";
import { ToolCapabilityCompatibilityChecker } from "../src/capability/tool-capability-compatibility-checker";
import { CapabilityRegistry } from "../src/capability/capability-registry";

describe("ToolCapabilityCompatibilityChecker", () => {
  it("should correctly identify compatibility when all requirements are met", () => {
    const mockRegistry: CapabilityRegistry = {
      "tool-a": {
        "capability-x": {
          requiredVersion: "1.0.0",
          minVersion: "1.0.0",
          featureFlags: {
            beta: true,
          },
        },
      },
      "tool-b": {
        "capability-y": {
          minVersion: "2.0.0",
          featureFlags: {
            new_ui: true,
          },
        },
      },
    };

    const checker = new ToolCapabilityCompatibilityChecker(mockRegistry);
    const requirements: Record<string, { [key: string]: any }> = {
      "tool-a": {
        "capability-x": {
          requiredVersion: "1.0.0",
          minVersion: "1.0.0",
          featureFlags: {
            beta: true,
          },
        },
      },
      "tool-b": {
        "capability-y": {
          minVersion: "2.0.0",
          featureFlags: {
            new_ui: true,
          },
        },
      },
    };

    const result = checker.checkCompatibility(requirements);
    expect(result.isCompatible).toBe(true);
    expect(result.incompatibilities).toEqual([]);
  });

  it("should report incompatibility when a required version is missing or too old", () => {
    const mockRegistry: CapabilityRegistry = {
      "tool-a": {
        "capability-x": {
          requiredVersion: "1.0.0",
          minVersion: "1.0.0",
          featureFlags: {
            beta: true,
          },
        },
      },
      "tool-b": {
        "capability-y": {
          minVersion: "1.5.0", // Too old for requirement
          featureFlags: {
            new_ui: true,
          },
        },
      },
    };

    const checker = new ToolCapabilityCompatibilityChecker(mockRegistry);
    const requirements: Record<string, { [key: string]: any }> = {
      "tool-a": {
        "capability-x": {
          requiredVersion: "1.0.0",
          minVersion: "1.0.0",
          featureFlags: {
            beta: true,
          },
        },
      },
      "tool-b": {
        "capability-y": {
          minVersion: "2.0.0", // Required minimum
          featureFlags: {
            new_ui: true,
          },
        },
      },
    };

    const result = checker.checkCompatibility(requirements);
    expect(result.isCompatible).toBe(false);
    expect(result.incompatibilities).toContain("Tool 'tool-b' requires capability 'capability-y' with minVersion '2.0.0', but found version '1.5.0'");
  });

  it("should report incompatibility when a required feature flag is missing or set to false", () => {
    const mockRegistry: CapabilityRegistry = {
      "tool-a": {
        "capability-x": {
          requiredVersion: "1.0.0",
          minVersion: "1.0.0",
          featureFlags: {
            beta: true,
          },
        },
      },
      "tool-b": {
        "capability-y": {
          minVersion: "2.0.0",
          featureFlags: {
            new_ui: false, // Incorrectly set
          },
        },
      },
    };

    const checker = new ToolCapabilityCompatibilityChecker(mockRegistry);
    const requirements: Record<string, { [key: string]: any }> = {
      "tool-a": {
        "capability-x": {
          requiredVersion: "1.0.0",
          minVersion: "1.0.0",
          featureFlags: {
            beta: true,
          },
        },
      },
      "tool-b": {
        "capability-y": {
          minVersion: "2.0.0",
          featureFlags: {
            new_ui: true, // Required true
          },
        },
      },
    };

    const result = checker.checkCompatibility(requirements);
    expect(result.isCompatible).toBe(false);
    expect(result.incompatibilities).toContain("Tool 'tool-b' requires feature flag 'new_ui' to be true for capability 'capability-y', but found false");
  });
});