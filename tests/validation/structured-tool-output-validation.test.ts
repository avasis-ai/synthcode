import { describe, it, expect } from "vitest";
import { StructuredValidator } from "../src/validation/structured-tool-output-validation";

describe("StructuredValidator", () => {
  it("should validate data successfully when all steps pass", () => {
    const schema = {
      id: "string",
      name: "string",
    };
    const steps: any[] = [
      (data: Record<string, unknown>) => ({ isValid: true, errors: [] }),
    ];
    const validator = new StructuredValidator(schema, steps);
    const result = validator.validate({ id: "123", name: "Test" });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors when validation steps fail", () => {
    const schema = {
      id: "string",
    };
    const steps: any[] = [
      (data: Record<string, unknown>) => ({ isValid: false, errors: ["ID is required"] }),
    ];
    const validator = new StructuredValidator(schema, steps);
    const result = validator.validate({ id: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("ID is required");
  });

  it("should return valid if no validation steps are provided", () => {
    const schema = {
      data: "any",
    };
    const steps: any[] = [];
    const validator = new StructuredValidator(schema, steps);
    const result = validator.validate({ data: "some value" });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});