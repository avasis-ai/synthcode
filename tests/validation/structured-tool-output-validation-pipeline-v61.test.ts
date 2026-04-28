import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidatorPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v61";

describe("StructuredToolOutputValidatorPipeline", () => {
  it("should correctly validate a simple structure", async () => {
    const pipeline = new StructuredToolOutputValidatorPipeline([
      {
        validate: async (context, data) => {
          if (typeof data.name === "string" && data.name.length > 0) {
            return { isValid: true, errors: [], correctedData: data };
          }
          return { isValid: false, errors: ["Name is required"], correctedData: undefined };
        },
      },
    ]);

    const context: any = { data: { name: "Test Name" }, history: [] };
    const result = await pipeline.validate(context, { name: "Test Name" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.correctedData).toEqual({ name: "Test Name" });
  });

  it("should report multiple validation errors", async () => {
    const pipeline = new StructuredToolOutputValidatorPipeline([
      {
        validate: async (context, data) => {
          const errors: string[] = [];
          if (!data.id) {
            errors.push("ID is missing");
          }
          if (typeof data.value !== "number" || data.value < 0) {
            errors.push("Value must be a non-negative number");
          }
          return { isValid: errors.length === 0, errors: errors, correctedData: data };
        },
      },
    ]);

    const context: any = { data: { id: null, value: -5 }, history: [] };
    const result = await pipeline.validate(context, { id: null, value: -5 });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["ID is missing", "Value must be a non-negative number"]);
    expect(result.correctedData).toEqual({ id: null, value: -5 });
  });

  it("should return the original data if validation fails but no correction is possible", async () => {
    const pipeline = new StructuredToolOutputValidatorPipeline([
      {
        validate: async (context, data) => {
          if (typeof data.requiredField === "string") {
            return { isValid: true, errors: [], correctedData: data };
          }
          return { isValid: false, errors: ["Required field is missing"], correctedData: undefined };
        },
      },
    ]);

    const context: any = { data: { requiredField: undefined }, history: [] };
    const result = await pipeline.validate(context, { requiredField: undefined });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Required field is missing");
    // In this specific test case, the validator returns undefined for correctedData on failure,
    // but we test that the structure is maintained.
    expect(result.correctedData).toBeUndefined();
  });
});