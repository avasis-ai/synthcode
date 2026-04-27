import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidationChain } from "../src/validation/tool-output-schema-validation-chain";

// Mock SchemaValidator for testing purposes
class MockValidator implements {
  constructor(private isValid: boolean, private errorMessage: string) {}

  validate(output: any): { isValid: boolean; errors: string[] } {
    if (this.isValid) {
      return { isValid: true, errors: [] };
    } else {
      return { isValid: false, errors: [this.errorMessage] };
    }
  }
}

describe("ToolOutputSchemaValidationChain", () => {
  it("should return valid result when all validators pass", () => {
    const validator1 = new MockValidator(true, "");
    const validator2 = new MockValidator(true, "");
    const chain = new ToolOutputSchemaValidationChain([validator1, validator2]);

    const result = chain.validate({ key: "value" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should collect all errors when collectAllErrors is true (default)", () => {
    const validator1 = new MockValidator(false, "Error 1");
    const validator2 = new MockValidator(false, "Error 2");
    const chain = new ToolOutputSchemaValidationChain([validator1, validator2]);

    const result = chain.validate({ key: "value" });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(expect.arrayContaining(["Error 1", "Error 2"]));
  });

  it("should stop and return first error when collectAllErrors is false", () => {
    const validator1 = new MockValidator(false, "First Error");
    const validator2 = new MockValidator(false, "Second Error");
    const chain = new ToolOutputSchemaValidationChain([validator1, validator2]);

    const result = chain.validate({ key: "value" }, false);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["First Error"]);
  });
});