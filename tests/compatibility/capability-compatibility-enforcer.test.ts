import { describe, it, expect } from "vitest";
import { CapabilityCompatibilityEnforcer } from "../src/compatibility/capability-compatibility-enforcer";
import { CapabilityRegistry, Capability } from "../src/compatibility/types";

describe("CapabilityCompatibilityEnforcer", () => {
  it("should return true if the required version matches the capability version", () => {
    const mockRegistry: CapabilityRegistry = {
      getCapability: (name: string) => {
        if (name === "test-cap") {
          return { name: "test-cap", version: "1.0.0" } as Capability;
        }
        return null;
      },
    };
    const enforcer = new CapabilityCompatibilityEnforcer(mockRegistry);
    expect(enforcer["checkVersionCompatibility"]("1.0.0", "test-cap")).toBe(true);
  });

  it("should return false if the required version does not match the capability version", () => {
    const mockRegistry: CapabilityRegistry = {
      getCapability: (name: string) => {
        if (name === "test-cap") {
          return { name: "test-cap", version: "1.0.0" } as Capability;
        }
        return null;
      },
    };
    const enforcer = new CapabilityCompatibilityEnforcer(mockRegistry);
    expect(enforcer["checkVersionCompatibility"]("2.0.0", "test-cap")).toBe(false);
  });

  it("should return false if the capability does not exist in the registry", () => {
    const mockRegistry: CapabilityRegistry = {
      getCapability: (name: string) => null,
    };
    const enforcer = new CapabilityCompatibilityEnforcer(mockRegistry);
    expect(enforcer["checkVersionCompatibility"]("1.0.0", "non-existent-cap")).toBe(false);
  });
});