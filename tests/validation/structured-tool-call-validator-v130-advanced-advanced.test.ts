import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorAdvancedAdvanced } from "../src/validation/structured-tool-call-validator-v130-advanced-advanced";

describe("StructuredToolCallValidatorAdvancedAdvanced", () => {
  it("should validate a correctly structured tool call with sufficient context", () => {
    const validator = new StructuredToolCallValidatorAdvancedAdvanced();
    const mockCall = {
      id: "tool_call_123",
      name: "get_user_profile",
      input: { user_id: "user123" },
    };
    const mockContext = {
      timestamp: Date.now(),
      resourceAvailability: { "user_service": true, "auth_service": true },
      userCapabilities: new Set(["read:profile", "write:data"]),
    };
    const result = validator.validate(mockCall, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.message).toContain("is valid");
  });

  it("should fail validation if the tool call name is missing or invalid", () => {
    const validator = new StructuredToolCallValidatorAdvancedAdvanced();
    const mockCall = {
      id: "tool_call_456",
      name: "", // Invalid name
      input: { user_id: "user456" },
    };
    const mockContext = {
      timestamp: Date.now(),
      resourceAvailability: { "user_service": true, "auth_service": true },
      userCapabilities: new Set(["read:profile"]),
    };
    const result = validator.validate(mockCall, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Tool name is required");
  });

  it("should fail validation if required input parameters are missing based on context", () => {
    const validator = new StructuredToolCallValidatorAdvancedAdvanced();
    const mockCall = {
      id: "tool_call_789",
      name: "update_settings",
      input: { /* Missing required 'setting_key' */ },
    };
    const mockContext = {
      timestamp: Date.now(),
      resourceAvailability: { "user_service": true, "auth_service": true },
      userCapabilities: new Set(["write:settings"]),
    };
    const result = validator.validate(mockCall, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Missing required input parameter");
  });
});