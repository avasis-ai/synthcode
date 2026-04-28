import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilderV111 } from "../src/validation/structured-tool-output-validation-pipeline-builder-v111";

describe("StructuredToolOutputValidationPipelineBuilderV111", () => {
  it("should correctly build a pipeline with schema and cross-field validators", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilderV111();
    const pipeline = builder
      .addSchemaValidator({
        validateSchema: (output) => ({ isValid: true, errors: [] }),
      })
      .addCrossFieldValidator({
        validateCrossField: (output) => ({ isValid: true, errors: [] }),
      })
      .build();

    expect(pipeline).toBeDefined();
    expect(typeof pipeline.validate).toBe("function");
  });

  it("should return an empty validation result when no validators are added", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilderV111();
    const pipeline = builder.build();

    const result = pipeline.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from multiple validator types", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilderV111();
    const schemaValidator = {
      validateSchema: (output) => ({ isValid: false, errors: ["Schema error"] }),
    };
    const crossFieldValidator = {
      validateCrossField: (output) => ({ isValid: false, errors: ["Cross-field error"] }),
    };

    const pipeline = builder
      .addSchemaValidator(schemaValidator)
      .addCrossFieldValidator(crossFieldValidator)
      .build();

    const result = pipeline.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Schema error", "Cross-field error"]);
  });
});