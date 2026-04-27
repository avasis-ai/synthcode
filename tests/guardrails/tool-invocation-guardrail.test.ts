import { describe, it, expect } from "vitest";
import { ToolInvocationGuardrail } from "../src/guardrails/tool-invocation-guardrail";

describe("ToolInvocationGuardrail", () => {
  it("should return valid when tool name and arguments match the schema", () => {
    const schema = {
      "get_weather": {
        location: { type: "string" },
        unit: { type: "string" },
      },
    };
    const guardrail = new ToolInvocationGuardrail(schema);
    const result = guardrail.validate("get_weather", { location: "London", unit: "celsius" });
    expect(result.isValid).toBe(true);
    expect(result.reason).toBe("");
  });

  it("should return invalid when tool name does not exist in the schema", () => {
    const schema = {
      "get_weather": {
        location: { type: "string" },
        unit: { type: "string" },
      },
    };
    const guardrail = new ToolInvocationGuardrail(schema);
    const result = guardrail.validate("non_existent_tool", { location: "Paris" });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Tool 'non_existent_tool' not found in the schema");
  });

  it("should return invalid when arguments are missing required fields", () => {
    const schema = {
      "get_weather": {
        location: { type: "string" },
        unit: { type: "string" },
      },
    };
    const guardrail = new ToolInvocationGuardrail(schema);
    const result = guardrail.validate("get_weather", { location: "Berlin" }); // Missing unit
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Missing required argument: unit");
  });
});