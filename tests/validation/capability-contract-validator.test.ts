import { describe, it, expect } from "vitest";
import { CapabilityContractValidator } from "../src/validation/capability-contract-validator";

describe("CapabilityContractValidator", () => {
  it("should validate a minimal valid capability contract", () => {
    const validator = new CapabilityContractValidator();
    const contract = {
      toolName: "test-tool",
      description: "A simple test tool.",
    };
    expect(validator.isValid(contract)).toBe(true);
  });

  it("should return false if toolName is missing", () => {
    const validator = new CapabilityContractValidator();
    const contract = {
      description: "Missing tool name.",
    };
    expect(validator.isValid(contract)).toBe(false);
  });

  it("should return false if description is missing", () => {
    const validator = new CapabilityContractValidator();
    const contract = {
      toolName: "test-tool",
      description: undefined as any,
    };
    expect(validator.isValid(contract)).toBe(false);
  });
});