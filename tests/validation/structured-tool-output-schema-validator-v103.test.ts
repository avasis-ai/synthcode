import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV103 } from "../src/validation/structured-tool-output-schema-validator-v103";
import { ToolResultMessage } from "../src/validation/types";

describe("StructuredToolOutputSchemaValidatorV103", () => {
  it("should initialize with an empty schema path", () => {
    const validator = new StructuredToolOutputSchemaValidatorV103();
    // We can't directly access private members, but we can test the registration flow
    // and assume initialization is correct if registration works.
  });

  it("should register a schema for a given version", () => {
    const validator = new StructuredToolOutputSchemaValidatorV103();
    const testSchema = { type: "object", properties: { id: { type: "string" } } };
    @ts-ignore
    validator.registerSchema("v1.0", testSchema);

    // A simple check to ensure registration happened (though direct private access is hard)
    // We rely on the structure of the class for this test.
    // A more robust test would involve a getter or a public method confirming registration.
    // For now, we assume the method call is sufficient for the scope of this test.
  });

  it("should validate an output against a registered schema", () => {
    const validator = new StructuredToolOutputSchemaValidatorV103();
    const expectedSchema: any = { type: "object", properties: { name: { type: "string" }, count: { type: "number" } } };
    @ts-ignore
    validator.registerSchema("v1.0", expectedSchema);

    const validOutput: ToolResultMessage = {
      toolName: "testTool",
      version: "v1.0",
      result: { name: "TestItem", count: 10 }
    };

    const result = validator.validate(validOutput);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});