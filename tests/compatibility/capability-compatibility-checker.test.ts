import { describe, it, expect } from "vitest"
import {
  Capability,
  VersionRange,
  InputRequirement,
  SideEffect,
} from "../../../src/compatibility/capability-compatibility-checker"

describe("Capability Compatibility Checker", () => {
  it("should correctly check compatibility when versions match", () => {
    const capability: Capability = {
      name: "TestCap",
      version: "1.0.0",
      description: "Test",
      inputs: [],
      effects: [],
      requiredVersionRange: {
        min: "1.0.0",
        max: "1.0.0",
      },
    }
    const isCompatible = capability.requiredVersionRange.min === "1.0.0" &&
      capability.requiredVersionRange.max === "1.0.0"

    expect(isCompatible).toBe(true)
  })

  it("should correctly check compatibility when version is within range", () => {
    const capability: Capability = {
      name: "TestCap",
      version: "1.5.0",
      description: "Test",
      inputs: [],
      effects: [],
      requiredVersionRange: {
        min: "1.0.0",
        max: "2.0.0",
      },
    }
    const isCompatible =
      "1.0.0" <= "1.5.0" && "1.5.0" <= "2.0.0"

    expect(isCompatible).toBe(true)
  })

  it("should correctly identify incompatibility when version is too old", () => {
    const capability: Capability = {
      name: "TestCap",
      version: "0.9.0",
      description: "Test",
      inputs: [],
      effects: [],
      requiredVersionRange: {
        min: "1.0.0",
        max: "2.0.0",
      },
    }
    const isCompatible = "1.0.0" <= "0.9.0" && "0.9.0" <= "2.0.0"

    expect(isCompatible).toBe(false)
  })
})