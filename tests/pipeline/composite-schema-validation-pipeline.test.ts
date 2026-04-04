import { describe, it, expect } from "vitest";
import { CompositeSchemaValidator } from "../src/pipeline/composite-schema-validation-pipeline";
import { MockSchemaValidator } from "../src/pipeline/mock-schema-validator";

describe("CompositeSchemaValidator", () => {
  it("should validate data against all provided schemas and aggregate errors", async () => {
    const mockValidator1 = {
      validate: (data: unknown) => ({ isValid: true, errors: [] }),
    };
    const mockValidator2 = {
      validate: (data: unknown) => ({ isValid: false, errors: ["Error in schema 2"] }),
    };
    const validator = new CompositeSchemaValidator([mockValidator1, mockValidator2], {});

    const result = validator.validate({ key: "value" });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Error in schema 2");
    expect(result.errors.length).toBe(1);
  });

  it("should return valid if all schemas pass validation", async () => {
    const mockValidator1 = {
      validate: (data: unknown) => ({ isValid: true, errors: [] }),
    };
    const mockValidator2 = {
      validate: (data: unknown) => ({ isValid: true, errors: [] }),
    };
    const validator = new CompositeSchemaValidator([mockValidator1, mockValidator2], {});

    const result = validator.validate({ key: "value" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should handle an empty list of schemas gracefully", async () => {
    const validator = new CompositeSchemaValidator([], {});

    const result = validator.validate({ key: "value" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});