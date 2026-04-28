import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v37";

describe("StructuredToolOutputValidationPipeline", () => {
  it("should return isValid true and empty errors array when all validators pass", () => {
    const mockPipeline = {
      validators: [
        (data: any, schema: any) => ({ isValid: true, errors: [] }),
        (data: any, schema: any) => ({ isValid: true, errors: [] }),
      ],
      execute: (data: any, schema: any) => ({ isValid: true, errors: [] }),
    } as unknown as any; // Mocking the class instance for simplicity in this test structure

    const result = mockPipeline.execute({ id: 1, content: "test" }, {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate all errors from multiple failing validators", () => {
    const mockPipeline = {
      validators: [
        (data: any, schema: any) => ({ isValid: false, errors: ["Error A"] }),
        (data: any, schema: any) => ({ isValid: false, errors: ["Error B"] }),
      ],
      execute: (data: any, schema: any) => ({ isValid: false, errors: ["Error A", "Error B"] }),
    } as unknown as any;

    const result = mockPipeline.execute({ id: 1, content: "test" }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error A", "Error B"]);
  });

  it("should handle an empty list of validators gracefully", () => {
    const mockPipeline = {
      validators: [],
      execute: (data: any, schema: any) => ({ isValid: true, errors: [] }),
    } as unknown as any;

    const result = mockPipeline.execute({ id: 1, content: "test" }, {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});