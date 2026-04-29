import { describe, it, expect } from "vitest";
import {
  ToolCapabilityCompatibilityResolver,
  Capability,
  CompatibilityConstraint,
  ResolutionResult,
} from "../src/capability/tool-capability-compatibility-resolver";

describe("ToolCapabilityCompatibilityResolver", () => {
  it("should return compatible when all capabilities meet constraints", () => {
    const resolver = new ToolCapabilityCompatibilityResolver();
    const capabilities: Capability[] = [
      {
        name: "tool-a",
        version: "1.0.0",
        description: "Tool A",
        constraints: { requiredContext: "context-a" },
      },
      {
        name: "tool-b",
        version: "2.1.0",
        description: "Tool B",
        constraints: { minVersion: "2.0.0" },
      },
    ];
    const result: ResolutionResult = resolver.resolve(capabilities);
    expect(result.compatible).toBe(true);
    expect(result.missing.length).toBe(0);
    expect(result.conflicts.length).toBe(0);
  });

  it("should detect incompatibility due to version mismatch", () => {
    const resolver = new ToolCapabilityCompatibilityResolver();
    const capabilities: Capability[] = [
      {
        name: "tool-a",
        version: "1.0.0",
        description: "Tool A",
        constraints: { minVersion: "2.0.0" }, // Requires 2.0.0 or higher
      },
      {
        name: "tool-b",
        version: "1.5.0",
        description: "Tool B",
        constraints: { maxVersion: "1.9.0" }, // Max 1.9.0
      },
    ];
    const result: ResolutionResult = resolver.resolve(capabilities);
    expect(result.compatible).toBe(false);
    expect(result.conflicts.length).toBe(2);
    expect(result.conflicts.some(c => c.capabilityName === "tool-a" && c.reason.includes("version"))).toBe(true);
    expect(result.conflicts.some(c => c.capabilityName === "tool-b" && c.reason.includes("version"))).toBe(true);
  });

  it("should detect missing required context", () => {
    const resolver = new ToolCapabilityCompatibilityResolver();
    const capabilities: Capability[] = [
      {
        name: "tool-a",
        version: "1.0.0",
        description: "Tool A",
        constraints: { requiredContext: "missing-context" },
      },
    ];
    const result: ResolutionResult = resolver.resolve(capabilities);
    expect(result.compatible).toBe(false);
    expect(result.missing.length).toBe(1);
    expect(result.missing[0].name).toBe("tool-a");
    expect(result.conflicts.length).toBe(0);
  });
});