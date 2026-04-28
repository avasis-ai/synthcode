import { describe, it, expect } from "vitest";
import { SchemaEvolutionGuardrail } from "../src/guardrails/tool-output-schema-evolution-guardrail";

describe("SchemaEvolutionGuardrail", () => {
  it("should warn when adding a new field if 'additive' rule is allowed", () => {
    const targetSchema = {
      id: "string",
      name: "string",
    };
    const options = {
      targetSchema,
      allowedRules: ["additive"],
    };
    const guardrail = new SchemaEvolutionGuardrail(options);
    const result = guardrail.check({
      id: "string",
      name: "string",
      newField: "number",
    });
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("newField");
    expect(result[0].severity).toBe("warning");
  });

  it("should error when changing a field type if 'optional_type_change' is not allowed", () => {
    const targetSchema = {
      id: "string",
      description: "string",
    };
    const options = {
      targetSchema,
      allowedRules: ["additive"],
    };
    const guardrail = new SchemaEvolutionGuardrail(options);
    const result = guardrail.check({
      id: "string",
      description: "number",
    });
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("description");
    expect(result[0].severity).toBe("error");
  });

  it("should pass if no schema changes are detected and no rules are violated", () => {
    const targetSchema = {
      id: "string",
      name: "string",
    };
    const options = {
      targetSchema,
      allowedRules: ["additive", "optional_type_change", "strict"],
    };
    const guardrail = new SchemaEvolutionGuardrail(options);
    const result = guardrail.check({
      id: "string",
      name: "string",
    });
    expect(result).toHaveLength(0);
  });
});